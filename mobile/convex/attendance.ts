import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";
import { getCurrentUser, mustBeTeacherOrAdmin, logActivity } from "./lib/permissions";
import { haversineDistance } from "./lib/utils";

/**
 * Automatically finds the current session for the user and records attendance.
 * Used by the mobile app when online.
 */
export const recordAttendance = mutation({
  args: {
    roomId: v.id("rooms"),
    timestamp: v.number(),
    method: v.union(v.literal("card"), v.literal("phone")),
    antiCheat: v.object({
      deviceTime: v.optional(v.number()),
      timeSource: v.optional(v.string()),
      hasInternet: v.optional(v.boolean()),
      deviceId: v.optional(v.string()),
      gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    const now = Date.now();
    
    // 1. Drift Protection: Ensure phone clock isn't spoofed (> 5 min drift)
    // Apply regardless of claimed timeSource - attackers could lie about it
    const driftMs = Math.abs(args.timestamp - now);
    if (driftMs > 5 * 60 * 1000) {
      await logActivity(ctx, user, "SUSPECT_TIME", `Large clock drift detected: ${Math.round(driftMs / 1000)}s`);
      // Use server time instead of trusting client timestamp
      args.timestamp = now;
    }

    const date = new Date(args.timestamp).toISOString().split("T")[0];
    const dayOfWeek = new Date(args.timestamp).getDay();
    const timeStr = new Date(args.timestamp).toTimeString().split(" ")[0].substring(0, 5);

    // 2. Find the room and check GPS geofencing
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    if (args.antiCheat.gps && room.gps) {
      const distance = haversineDistance(
        args.antiCheat.gps.lat, args.antiCheat.gps.lng,
        room.gps.lat, room.gps.lng
      );
      if (distance > 100) {
        await logActivity(ctx, user, "SUSPECT_GPS", `Attendance attempt from ${Math.round(distance)}m away`);
        throw new Error("You must be physically present in the classroom to mark attendance.");
      }
    }

    // 3. Find the homeroom
    const homeroom = await ctx.db
      .query("homerooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!homeroom) throw new Error("No homeroom associated with this room");

    // 4. Find the schedule slot
    const slot = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_homeroom", (q) => q.eq("homeroomId", homeroom._id))
      .filter((q) => q.and(
        q.eq(q.field("dayOfWeek"), dayOfWeek),
        q.lte(q.field("startTime"), timeStr),
        q.gte(q.field("endTime"), timeStr)
      ))
      .first();

    if (!slot) throw new Error("No class session found at this time");

    // 5. Find the daily session
    const session = await ctx.db
      .query("dailySessions")
      .withIndex("by_slot", (q) => q.eq("scheduleSlotId", slot._id))
      .filter((q) => q.eq(q.field("date"), date))
      .unique();

    if (!session) throw new Error("Class session not active today");

    // 6. Record attendance
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_session", (q) => q.eq("dailySessionId", session._id))
      .filter((q) => q.eq(q.field("studentId"), user._id))
      .unique();

    if (!existing) throw new Error("Student not enrolled in this homeroom");

    await ctx.db.patch(existing._id, {
      status: args.timestamp > session.windowEnd ? "late" : "present",
      scanTime: args.timestamp,
      method: args.method,
      markedManually: false,
      // Explicitly pick antiCheat fields - don't spread untrusted data
      deviceTime: args.antiCheat.deviceTime,
      timeSource: args.antiCheat.timeSource,
      hasInternet: args.antiCheat.hasInternet,
      deviceId: args.antiCheat.deviceId,
      gps: args.antiCheat.gps,
    });

    return { success: true, sessionName: (await ctx.db.get(slot.subjectId))?.name };
  },
});

/**
 * Teacher override for attendance.
 * Teachers can only modify attendance for their own sessions.
 * Admins can modify any session.
 */
export const teacherOverride = mutation({
  args: {
    attendanceId: v.id("attendance"),
    status: v.union(v.literal("present"), v.literal("late"), v.literal("absent"), v.literal("excused")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeTeacherOrAdmin(user);

    // Get the attendance record
    const attendance = await ctx.db.get(args.attendanceId);
    if (!attendance) {
      throw new Error("Attendance record not found");
    }

    // Get the session to verify ownership
    const session = await ctx.db.get(attendance.dailySessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    // Get the schedule slot to find the teacher
    const slot = await ctx.db.get(session.scheduleSlotId);
    if (!slot) {
      throw new Error("Schedule slot not found");
    }

    // Teachers can only modify their own sessions, admins can modify any
    if (user!.role === "teacher" && slot.teacherId !== user!._id) {
      throw new Error("You can only modify attendance for your own classes");
    }

    await ctx.db.patch(args.attendanceId, {
      status: args.status,
      note: args.note,
      markedManually: true,
      markedBy: user!._id,
    });

    await logActivity(ctx, user!, "ATTENDANCE_OVERRIDE", 
      `Changed attendance for student to ${args.status}`);

    return { success: true };
  },
});

/**
 * Gets attendance roster for a session.
 * Requires teacher/admin role or own session access.
 */
export const getSessionAttendance = query({
  args: { dailySessionId: v.id("dailySessions") },
  handler: async (ctx, args) => {
    // Auth check - require authenticated user with appropriate role
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }
    
    // Students can only view their own attendance
    if (user.role === "student") {
      throw new Error("Students cannot view session attendance roster");
    }
    
    // Teachers, staff, and admins can view
    if (user.role !== "admin" && user.role !== "teacher" && user.role !== "staff") {
      throw new Error("Unauthorized");
    }

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_session", (q) => q.eq("dailySessionId", args.dailySessionId))
      .collect();

    if (records.length === 0) return [];

    const studentIds = [...new Set(records.map(r => r.studentId))];
    const students = await Promise.all(studentIds.map(id => ctx.db.get(id)));
    const studentMap = new Map(students.filter((s): s is Doc<"users"> => s !== null).map(s => [s._id, s]));

    return records.map(record => ({
      ...record,
      studentName: studentMap.get(record.studentId)?.name,
    }));
  },
});

/**
 * Gets attendance history for a student.
 * Requires authentication - students can only view their own history.
 */
export const getStudentHistory = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    // Auth check
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }
    
    // Students can only view their own history
    if (user.role === "student" && user._id !== args.studentId) {
      throw new Error("You can only view your own attendance history");
    }
    
    // Non-students can view any student's history
    if (user.role !== "admin" && user.role !== "teacher" && user.role !== "staff" && user.role !== "student") {
      throw new Error("Unauthorized");
    }

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    if (records.length === 0) return [];

    const sessionIds = [...new Set(records.map(r => r.dailySessionId))];
    const sessions = await Promise.all(sessionIds.map(id => ctx.db.get(id)));
    const sessionMap = new Map(sessions.filter((s): s is Doc<"dailySessions"> => s !== null).map(s => [s._id, s]));

    const slotIds = [...new Set(Array.from(sessionMap.values()).map(s => s.scheduleSlotId))];
    const slots = await Promise.all(slotIds.map(id => ctx.db.get(id)));
    const slotMap = new Map(slots.filter((s): s is Doc<"scheduleSlots"> => s !== null).map(s => [s._id, s]));

    const subjectIds = [...new Set(Array.from(slotMap.values()).map(s => s.subjectId))];
    const subjects = await Promise.all(subjectIds.map(id => ctx.db.get(id)));
    const subjectMap = new Map(subjects.filter((s): s is Doc<"subjects"> => s !== null).map(s => [s._id, s]));

    return records.map(record => {
      const session = sessionMap.get(record.dailySessionId);
      if (!session) return null;
      
      const slot = slotMap.get(session.scheduleSlotId);
      if (!slot) return null;
      
      const subject = subjectMap.get(slot.subjectId);

      return {
        ...record,
        date: session.date,
        subjectName: subject?.name,
        startTime: slot.startTime,
      };
    }).filter(r => r !== null);
  },
});
