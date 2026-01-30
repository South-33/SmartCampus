import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { MutationCtx } from "./_generated/server";
import { Id, Doc } from "./_generated/dataModel";
import { getCambodiaDateString, getCambodiaDayOfWeek, parseTimeForDate } from "./lib/timezone";
import { calculateAttendanceWindow } from "./lib/utils";

// ===== INTERNAL MUTATIONS =====

/**
 * Transitions dailySession statuses based on current time:
 * - upcoming → open (when windowStart reached)
 * - open → closed (when windowEnd reached)
 */
export const updateSessionStatuses = internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    
    // 1. Find all "upcoming" sessions where windowStart has passed
    const upcomingSessions = await ctx.db
      .query("dailySessions")
      .withIndex("by_status", q => q.eq("status", "upcoming"))
      .collect();
    
    for (const session of upcomingSessions) {
      if (now >= session.windowStart) {
        await ctx.db.patch(session._id, { status: "open" });
      }
    }
    
    // 2. Find all "open" sessions where windowEnd has passed
    const openSessions = await ctx.db
      .query("dailySessions")
      .withIndex("by_status", q => q.eq("status", "open"))
      .collect();
    
    for (const session of openSessions) {
      if (now >= session.windowEnd) {
        await ctx.db.patch(session._id, { status: "closed" });
      }
    }
  },
});

/**
 * Creates dailySessions for today based on scheduleSlots.
 * Runs at midnight (00:05) daily.
 */
export const dailyGenerator = internalMutation({
  handler: async (ctx: MutationCtx) => {
    // Get active semester
    const semester = await ctx.db
      .query("semesters")
      .withIndex("by_status", q => q.eq("status", "active"))
      .unique();
    
    if (!semester) return;
    
    const todayStr = getCambodiaDateString();
    const dayOfWeek = getCambodiaDayOfWeek();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) return;
    
    // Check if schoolDay exists for today
    let schoolDay = await ctx.db
      .query("schoolDays")
      .withIndex("by_date", q => q.eq("date", todayStr))
      .filter(q => q.eq(q.field("semesterId"), semester._id))
      .first();
    
    // Create schoolDay if it doesn't exist
    if (!schoolDay) {
      const id = await ctx.db.insert("schoolDays", {
        semesterId: semester._id,
        date: todayStr,
        dayType: "regular",
      });
      schoolDay = await ctx.db.get(id);
    }
    
    if (!schoolDay || schoolDay.dayType === "holiday") return;
    
    // Get all schedule slots for today's day of week
    const slots = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_day", q => q.eq("dayOfWeek", dayOfWeek))
      .collect();
    
    for (const slot of slots) {
      // Check if session already exists
      const existing = await ctx.db
        .query("dailySessions")
        .withIndex("by_slot_date", q => 
          q.eq("scheduleSlotId", slot._id).eq("date", todayStr)
        )
        .first();
      
      if (existing) continue; 
      
      // Calculate window times
      const startTime = parseTimeForDate(todayStr, slot.startTime);
      const endTime = parseTimeForDate(todayStr, slot.endTime);
      
      const { windowStart, windowEnd } = calculateAttendanceWindow(startTime, endTime - startTime);
      
      // Create session
      const sessionId = await ctx.db.insert("dailySessions", {
        scheduleSlotId: slot._id,
        schoolDayId: schoolDay._id,
        date: todayStr,
        status: "upcoming",
        windowStart,
        windowEnd,
      });
      
      // Pre-populate attendance as "absent"
      const enrollments = await ctx.db
        .query("homeroomStudents")
        .withIndex("by_homeroom", q => q.eq("homeroomId", slot.homeroomId))
        .filter(q => q.eq(q.field("status"), "active"))
        .collect();
      
      for (const enroll of enrollments) {
        await ctx.db.insert("attendance", {
          dailySessionId: sessionId,
          studentId: enroll.studentId,
          status: "absent",
          markedManually: false,
        });
      }
    }
  },
});

/**
 * Checks device health and creates alerts.
 * Devices offline > 15 minutes get flagged.
 */
export const monitorDeviceHealth = internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    const offlineThreshold = 15 * 60 * 1000; // 15 minutes
    
    const devices = await ctx.db.query("devices").collect();
    
    for (const device of devices) {
      if (!device.lastSeen) continue;
      
      const isOffline = (now - device.lastSeen) > offlineThreshold;
      const wasOnline = device.status === "online" || device.status === "active";
      
      if (isOffline && wasOnline) {
        // Update device status
        await ctx.db.patch(device._id, { status: "offline" });
        
        // Check if we already have an active alert
        const existingAlert = await ctx.db
          .query("adminAlerts")
          .withIndex("by_status", q => q.eq("status", "active"))
          .filter(q => q.eq(q.field("deviceId"), device._id))
          .first();
        
        if (!existingAlert) {
          await ctx.db.insert("adminAlerts", {
            type: "DEVICE_OFFLINE",
            severity: "medium",
            message: `Device "${device.name}" has been offline for > 15 minutes`,
            deviceId: device._id,
            roomId: device.roomId,
            timestamp: now,
            status: "active",
          });
        }
      }
    }
  },
});

/**
 * Analyzes patterns for cheating indicators.
 * Runs hourly.
 */
export const analyzeSuspiciousActivity = internalMutation({
  handler: async (ctx: MutationCtx) => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const twelveHoursAgo = now - (12 * 60 * 60 * 1000);
    
    // 1. Check for users with >50% "no internet" scans in 7 days
    const recentAttendance = await ctx.db
      .query("attendance")
      .filter(q => q.gt(q.field("scanTime"), sevenDaysAgo))
      .collect();
    
    const byStudent = new Map<string, { total: number; noInternet: number }>();
    for (const record of recentAttendance) {
      if (!record.scanTime) continue;
      const key = record.studentId;
      const current = byStudent.get(key) || { total: 0, noInternet: 0 };
      current.total++;
      if (record.hasInternet === false) current.noInternet++;
      byStudent.set(key, current);
    }
    
    for (const [studentId, stats] of byStudent) {
      if (stats.total >= 5 && (stats.noInternet / stats.total) > 0.5) {
        const student = await ctx.db.get(studentId as Id<"users">);
        if (!student || student.role !== "student") continue;

        const existing = await ctx.db
          .query("adminAlerts")
          .withIndex("by_status", q => q.eq("status", "active"))
          .filter(q => q.and(
            q.eq(q.field("userId"), studentId as Id<"users">),
            q.eq(q.field("type"), "SUSPECT_DEVICE")
          ))
          .first();
        
        if (!existing) {
          await ctx.db.insert("adminAlerts", {
            type: "SUSPECT_DEVICE",
            severity: "medium",
            message: `Student "${student.name}" has ${Math.round((stats.noInternet/stats.total)*100)}% "no internet" scans (${stats.noInternet}/${stats.total}) in 7 days`,
            userId: studentId as Id<"users">,
            timestamp: now,
            status: "active",
          });
        }
      }
    }
    
    // 2. Check for device sharing (2+ accounts on 1 device in 12h)
    const recentLogs = await ctx.db
      .query("accessLogs")
      .withIndex("by_timestamp", q => q.gt("timestamp", twelveHoursAgo))
      .collect();
    
    const byDevice = new Map<string, Set<string>>();
    for (const log of recentLogs) {
      if (!log.deviceId) continue;
      const users = byDevice.get(log.deviceId) || new Set();
      users.add(log.userId);
      byDevice.set(log.deviceId, users);
    }
    
    for (const [deviceId, users] of byDevice) {
      if (users.size >= 2) {
        // Check for existing active alert for this device
        const existing = await ctx.db
          .query("adminAlerts")
          .withIndex("by_status", q => q.eq("status", "active"))
          .filter(q => q.and(
            q.eq(q.field("deviceId"), deviceId as any),
            q.eq(q.field("type"), "SUSPECT_DEVICE")
          ))
          .first();

        if (!existing) {
          await ctx.db.insert("adminAlerts", {
            type: "SUSPECT_DEVICE",
            severity: "high",
            message: `Hardware Device ${deviceId} was used by ${users.size} different accounts in 12 hours`,
            timestamp: now,
            status: "active",
          });
        }
      }
    }
  },
});

// ===== CRON DEFINITIONS =====

const crons = cronJobs();

crons.interval(
  "update session statuses",
  { minutes: 2 },
  internal.crons.updateSessionStatuses
);

crons.daily(
  "generate daily sessions",
  { hourUTC: 17, minuteUTC: 5 }, // 00:05 Cambodia time (UTC+7)
  internal.crons.dailyGenerator
);

crons.interval(
  "monitor device health",
  { minutes: 5 },
  internal.crons.monitorDeviceHealth
);

crons.interval(
  "analyze suspicious activity",
  { hours: 1 },
  internal.crons.analyzeSuspiciousActivity
);

export default crons;
