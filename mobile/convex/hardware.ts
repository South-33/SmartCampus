import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { logActivity } from "./lib/permissions";
import { hashToken, generateSecureToken, haversineDistance, secureCompare } from "./lib/utils";

/**
 * Validates that a request is coming from a legitimate hardware device.
 * Uses constant-time comparison to prevent timing attacks.
 */
async function validateDevice(
  ctx: QueryCtx | MutationCtx, 
  chipId: string, 
  token: string, 
  requireActive: boolean = true
): Promise<Doc<"devices">> {
  const device = await ctx.db
    .query("devices")
    .withIndex("by_chipId", (q) => q.eq("chipId", chipId))
    .unique();

  if (!device || !device.tokenHash) {
    throw new Error("Unauthorized hardware");
  }

  const incomingHash = await hashToken(token);
  
  // Use constant-time comparison to prevent timing attacks
  if (!secureCompare(device.tokenHash, incomingHash)) {
    throw new Error("Unauthorized hardware");
  }

  if (requireActive && device.status !== "active" && device.status !== "online") {
    // Generic error to not leak device status
    throw new Error("Device not authorized");
  }

  return device;
}

/**
 * Returns the whitelist for a specific device based on homeroom enrollment.
 */
export const getWhitelist = query({
  args: { chipId: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const device = await validateDevice(ctx, args.chipId, args.token);
    if (!device.roomId) return { entries: [] };

    const room = await ctx.db.get(device.roomId);

    // 1. Get Active Semester
    const semester = await ctx.db
      .query("semesters")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .unique();
    
    if (!semester) return { entries: [] };

    // 2. Find Homeroom associated with this room for the active semester
    const homeroom = await ctx.db
      .query("homerooms")
      .withIndex("by_room", (q) => q.eq("roomId", device.roomId!))
      .filter((q) => q.eq(q.field("semesterId"), semester._id))
      .first();

    if (!homeroom) {
      // If no homeroom, only allow staff/admin access
      const staff = await ctx.db
        .query("users")
        .filter((q) => q.or(
          q.eq(q.field("role"), "admin"),
          q.eq(q.field("role"), "teacher"),
          q.eq(q.field("role"), "staff")
        ))
        .collect();
        
      return {
        roomId: device.roomId,
        roomName: room?.name,
        entries: staff
          .filter(u => !!u.cardUID)
          .map(u => ({ uid: u.cardUID, sid: u._id, role: u.role, bioId: u.biometricId || 0 }))
      };
    }

    // 3. Get Enrolled Students
    const enrollments = await ctx.db
      .query("homeroomStudents")
      .withIndex("by_homeroom", (q) => q.eq("homeroomId", homeroom._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const students = [];
    for (const enroll of enrollments) {
      const student = await ctx.db.get(enroll.studentId);
      if (student?.cardUID) students.push(student);
    }

    // 4. Get All Staff
    const staff = await ctx.db
      .query("users")
      .filter((q) => q.or(
        q.eq(q.field("role"), "admin"),
        q.eq(q.field("role"), "teacher"),
        q.eq(q.field("role"), "staff")
      ))
      .collect();

    const allAuthorized = [...staff, ...students];

    return {
      roomId: device.roomId,
      roomName: room?.name,
      entries: allAuthorized
        .filter(u => !!u.cardUID)
        .map(u => ({
          uid: u.cardUID,
          sid: u._id,
          role: u.role,
          bioId: u.biometricId || 0
        }))
    };
  }
});

/**
 * Accepts a batch of access logs from the ESP32.
 */
export const syncLogs = mutation({
  args: {
    chipId: v.string(),
    token: v.string(),
    logs: v.array(v.object({
      userId: v.id("users"),
      method: v.union(v.literal("card"), v.literal("phone")),
      action: v.union(v.literal("OPEN_GATE"), v.literal("ATTENDANCE")),
      result: v.string(),
      timestamp: v.number(),
      timestampType: v.union(v.literal("server"), v.literal("local")),
      scanOrder: v.optional(v.number()),
      deviceTime: v.optional(v.number()),
      timeSource: v.optional(v.string()),
      hasInternet: v.optional(v.boolean()),
      deviceId: v.optional(v.string()),
      gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    }))
  },
  handler: async (ctx, args) => {
    const device = await validateDevice(ctx, args.chipId, args.token);
    if (!device.roomId) throw new Error("Device not assigned to a room");

    const room = await ctx.db.get(device.roomId);

    for (const log of args.logs) {
      const user = await ctx.db.get(log.userId);
      if (!user) continue;
      
      // Basic Anti-Cheat: Verify Device Binding
      if (log.deviceId && user.deviceId && log.deviceId !== user.deviceId) {
        // Only log activity, don't throw to avoid blocking other logs in batch
        await logActivity(ctx, user, "SUSPECT_DEVICE", `Account used on unauthorized device: ${log.deviceId}`);
      }

      // Basic Anti-Cheat: GPS Geofencing
      if (log.gps && room?.gps) {
        const distanceMeters = haversineDistance(
          log.gps.lat, log.gps.lng,
          room.gps.lat, room.gps.lng
        );
        
        // Flag if student is > 100 meters from room
        if (distanceMeters > 100) {
          await logActivity(ctx, user, "SUSPECT_GPS", 
            `Student scanned ${Math.round(distanceMeters)}m from room ${room.name}`);
        }
      }

      await ctx.db.insert("accessLogs", {
        ...log,
        roomId: device.roomId,
      });

      // If it's an attendance action, match it to a dailySession
      if (log.action === "ATTENDANCE") {
        // 1. Find the schedule slot for this room at this time
        const date = new Date(log.timestamp).toISOString().split("T")[0];
        const dayOfWeek = new Date(log.timestamp).getDay();
        const timeStr = new Date(log.timestamp).toTimeString().split(" ")[0].substring(0, 5); // "HH:MM"

        const homeroom = await ctx.db
          .query("homerooms")
          .withIndex("by_room", (q) => q.eq("roomId", device.roomId!))
          .first();

        if (homeroom) {
          const slot = await ctx.db
            .query("scheduleSlots")
            .withIndex("by_homeroom", (q) => q.eq("homeroomId", homeroom._id))
            .filter((q) => q.and(
              q.eq(q.field("dayOfWeek"), dayOfWeek),
              q.lte(q.field("startTime"), timeStr),
              q.gte(q.field("endTime"), timeStr)
            ))
            .first();

          if (slot) {
            const session = await ctx.db
              .query("dailySessions")
              .withIndex("by_slot", (q) => q.eq("scheduleSlotId", slot._id))
              .filter((q) => q.eq(q.field("date"), date))
              .unique();

            if (session) {
              // Found a matching session, record the attendance
              const existingAttendance = await ctx.db
                .query("attendance")
                .withIndex("by_session", (q) => q.eq("dailySessionId", session._id))
                .filter((q) => q.eq(q.field("studentId"), log.userId))
                .unique();

              if (existingAttendance) {
                await ctx.db.patch(existingAttendance._id, {
                  status: log.timestamp > session.windowEnd ? "late" : "present", // Simple logic
                  scanTime: log.timestamp,
                  method: log.method,
                  markedManually: false,
                  deviceTime: log.deviceTime,
                  timeSource: log.timeSource,
                  hasInternet: log.hasInternet,
                  deviceId: log.deviceId,
                  gps: log.gps,
                  scanOrder: log.scanOrder,
                });
              }
            }
          }
        }
      }
    }
    
    return { success: true, count: args.logs.length };
  }
});

export const heartbeat = mutation({
  args: { chipId: v.string(), token: v.string(), firmware: v.string() },
  handler: async (ctx, args) => {
    const device = await validateDevice(ctx, args.chipId, args.token, false);
    const newStatus = device.status === "active" ? "online" : device.status;

    await ctx.db.patch(device._id, {
      lastSeen: Date.now(),
      firmwareVersion: args.firmware,
      status: newStatus
    });

    return { success: true };
  }
});

async function checkRateLimit(ctx: MutationCtx, key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();

  if (!existing || now - existing.windowStart > windowMs) {
    if (existing) {
      await ctx.db.patch(existing._id, { attempts: 1, windowStart: now });
    } else {
      await ctx.db.insert("rateLimits", { key, attempts: 1, windowStart: now });
    }
    return true;
  }

  if (existing.attempts >= limit) {
    return false;
  }

  await ctx.db.patch(existing._id, { attempts: existing.attempts + 1 });
  return true;
}

/**
 * Returns system configuration for authenticated devices.
 * Devices cache this in NVS and refresh periodically.
 */
export const getSystemConfig = query({
  args: { chipId: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    await validateDevice(ctx, args.chipId, args.token);
    
    const config = await ctx.db.query("systemConfig").first();
    if (!config) {
      throw new Error("System not configured");
    }
    
    return {
      pmk: config.espNowPmk,
      secret: config.espNowSharedSecret,
      debug: config.debugMode,
      version: config.updatedAt,
    };
  }
});

export const register = mutation({
  args: { chipId: v.string() },
  handler: async (ctx, args) => {
    // Rate limit: 5 registration attempts per chipId per hour
    const isAllowed = await checkRateLimit(ctx, `register:${args.chipId}`, 5, 60 * 60 * 1000);
    if (!isAllowed) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const existing = await ctx.db
      .query("devices")
      .withIndex("by_chipId", (q) => q.eq("chipId", args.chipId))
      .unique();

    if (existing) {
      return { status: "already_registered", chipId: args.chipId, token: null };
    }

    const token = generateSecureToken(24);
    const tokenHash = await hashToken(token);

    await ctx.db.insert("devices", {
      chipId: args.chipId,
      tokenHash: tokenHash,
      name: `Unassigned Device (${args.chipId.slice(-4)})`,
      status: "pending",
      lastSeen: Date.now(),
    });

    return { status: "registered", chipId: args.chipId, token: token };
  }
});
