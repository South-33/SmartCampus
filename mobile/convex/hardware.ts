import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { logActivity } from "./lib/permissions";

/**
 * Validates that a request is coming from a legitimate hardware device.
 * We use a simple token check. 
 */
async function validateDevice(ctx: QueryCtx | MutationCtx, chipId: string, token: string): Promise<Doc<"devices">> {
  const device = await ctx.db
    .query("devices")
    .withIndex("by_chipId", (q) => q.eq("chipId", chipId))
    .unique();

  // In a production environment, we would compare a hash of the token.
  // For this project, we check the token directly but ensure it was issued securely.
  if (!device || !device.tokenHash || device.tokenHash !== token) {
    throw new Error("Unauthorized hardware");
  }
  return device;
}

/**
 * Returns the whitelist for a specific device.
 */
export const getWhitelist = query({
  args: { chipId: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const device = await validateDevice(ctx, args.chipId, args.token);
    if (!device.roomId) return { entries: [] };

    const room = await ctx.db.get(device.roomId);

    // 1. Fetch Staff (Admins, Teachers, Staff) - small list
    const staff = await ctx.db
      .query("users")
      .withIndex("by_role")
      .filter((q) => q.or(
        q.eq(q.field("role"), "admin"),
        q.eq(q.field("role"), "teacher"),
        q.eq(q.field("role"), "staff")
      ))
      .collect();

    // 2. Fetch Students specifically enrolled in this room
    const students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();
    
    const authorizedStudents = students.filter(u => u.allowedRooms?.includes(device.roomId!));

    const allAuthorized = [...staff, ...authorizedStudents];

    return {
      roomId: device.roomId,
      roomName: room?.name,
      lastUpdated: room?.lastUpdated || 0,
      entries: allAuthorized
        .filter(u => !!u.cardUID)
        .map(u => ({
          uid: u.cardUID,
          sid: u._id,
          role: u.role
        }))
    };
  }
});

/**
 * Accepts a batch of access logs from the ESP32.
 * Includes Anti-Cheat verification fields from the README.
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
      
      // Anti-Cheat payload from README
      deviceTime: v.optional(v.number()),
      timeSource: v.optional(v.string()), // "ntp" or "local"
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
      
      // Basic Anti-Cheat: Verify Device Binding
      if (log.deviceId && user?.deviceId && log.deviceId !== user.deviceId) {
        await logActivity(ctx, user, "SUSPECT_DEVICE", `Account used on unauthorized device: ${log.deviceId}`);
      }

      // Basic Anti-Cheat: GPS Geofencing (100m threshold approx)
      if (log.gps && room?.gps) {
        const dist = Math.sqrt(
          Math.pow(log.gps.lat - room.gps.lat, 2) + 
          Math.pow(log.gps.lng - room.gps.lng, 2)
        );
        if (dist > 0.001) { // Very rough ~100m check
          await logActivity(ctx, user!, "SUSPECT_GPS", `Student scanned far from room ${room.name}`);
        }
      }

      await ctx.db.insert("accessLogs", {
        ...log,
        roomId: device.roomId,
      });
    }
    
    return { success: true, count: args.logs.length };
  }
});

/**
 * Simple heartbeat to keep device status updated and check for whitelist changes.
 */
export const heartbeat = mutation({
  args: { 
    chipId: v.string(), 
    token: v.string(), 
    firmware: v.string() 
  },
  handler: async (ctx, args) => {
    const device = await validateDevice(ctx, args.chipId, args.token);
    const room = device.roomId ? await ctx.db.get(device.roomId) : null;

    await ctx.db.patch(device._id, {
      lastSeen: Date.now(),
      firmwareVersion: args.firmware,
      status: "online"
    });

    return { 
      success: true,
      lastUpdated: room?.lastUpdated || 0,
      roomName: room?.name || "Unassigned"
    };
  }
});

/**
 * Register a new device with a secure token.
 * SECURITY: Token is only returned ONCE on initial registration.
 */
export const register = mutation({
  args: { chipId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_chipId", (q) => q.eq("chipId", args.chipId))
      .unique();

    if (existing) {
      // Security: Do NOT return the token if the device already exists.
      // If the hardware loses its token, an admin must reset it in the dashboard.
      return { 
        status: "already_registered", 
        chipId: args.chipId,
        token: null 
      };
    }

    // Generate a secure random token using crypto
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const token = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");

    await ctx.db.insert("devices", {
      chipId: args.chipId,
      tokenHash: token,
      name: `Unassigned Device (${args.chipId.slice(-4)})`,
      status: "pending",
      lastSeen: Date.now(),
    });

    return { 
      status: "registered", 
      chipId: args.chipId, 
      token: token 
    };
  }
});
