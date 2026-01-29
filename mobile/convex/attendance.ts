import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, mustBeTeacherOrAdmin } from "./lib/permissions";

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

    const date = new Date(args.timestamp).toISOString().split("T")[0];
    const dayOfWeek = new Date(args.timestamp).getDay();
    const timeStr = new Date(args.timestamp).toTimeString().split(" ")[0].substring(0, 5);

    // 1. Find the homeroom
    const homeroom = await ctx.db
      .query("homerooms")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .first();

    if (!homeroom) throw new Error("No homeroom associated with this room");

    // 2. Find the schedule slot
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

    // 3. Find the daily session
    const session = await ctx.db
      .query("dailySessions")
      .withIndex("by_slot", (q) => q.eq("scheduleSlotId", slot._id))
      .filter((q) => q.eq(q.field("date"), date))
      .unique();

    if (!session) throw new Error("Class session not active today");

    // 4. Record attendance
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
      ...args.antiCheat,
    });

    return { success: true, sessionName: (await ctx.db.get(slot.subjectId))?.name };
  },
});

/**
 * Teacher override for attendance.
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

    await ctx.db.patch(args.attendanceId, {
      status: args.status,
      note: args.note,
      markedManually: true,
      markedBy: user!._id,
    });

    return { success: true };
  },
});

/**
 * Gets attendance roster for a session.
 */
export const getSessionAttendance = query({
  args: { dailySessionId: v.id("dailySessions") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_session", (q) => q.eq("dailySessionId", args.dailySessionId))
      .collect();

    const results = [];
    for (const record of records) {
      const student = await ctx.db.get(record.studentId);
      results.push({
        ...record,
        studentName: student?.name,
      });
    }
    return results;
  },
});

/**
 * Gets attendance history for a student.
 */
export const getStudentHistory = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    const results = [];
    for (const record of records) {
      const session = await ctx.db.get(record.dailySessionId);
      if (!session) continue;
      
      const slot = await ctx.db.get(session.scheduleSlotId);
      if (!slot) continue;
      
      const subject = await ctx.db.get(slot.subjectId);

      results.push({
        ...record,
        date: session.date,
        subjectName: subject?.name,
        startTime: slot.startTime,
      });
    }
    return results;
  },
});
