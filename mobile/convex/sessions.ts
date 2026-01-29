import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getCurrentUser, mustBeAdmin } from "./lib/permissions";

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { parseTimeForDate } from "./lib/timezone";

/**
 * Logic to generate sessions for a day. Shared between public and internal mutations.
 */
async function generateSessionsLogic(ctx: MutationCtx, schoolDayId: Id<"schoolDays">) {
  const schoolDay = await ctx.db.get(schoolDayId);
  if (!schoolDay) return;
  if (schoolDay.dayType === "holiday") return;

  const date = new Date(schoolDay.date);
  const dayOfWeek = date.getDay(); 
  if (dayOfWeek === 0 || dayOfWeek === 6) return;

  const slots = await ctx.db
    .query("scheduleSlots")
    .withIndex("by_day", (q) => q.eq("dayOfWeek", dayOfWeek))
    .collect();

  for (const slot of slots) {
    const startTimestamp = parseTimeForDate(schoolDay.date, slot.startTime);
    const endTimestamp = parseTimeForDate(schoolDay.date, slot.endTime);

    const durationMs = endTimestamp - startTimestamp;
    const windowStart = startTimestamp - (15 * 60 * 1000);
    const windowEnd = startTimestamp + (durationMs / 2);

    const sessionId = await ctx.db.insert("dailySessions", {
      scheduleSlotId: slot._id,
      schoolDayId: schoolDayId,
      date: schoolDay.date,
      status: "upcoming",
      windowStart,
      windowEnd,
    });

    const enrollments = await ctx.db
      .query("homeroomStudents")
      .withIndex("by_homeroom", (q) => q.eq("homeroomId", slot.homeroomId))
      .filter((q) => q.eq(q.field("status"), "active"))
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
}

/**
 * Internal version of session generator for crons.
 */
export const generateSessionsForDayInternal = internalMutation({
  args: { schoolDayId: v.id("schoolDays") },
  handler: async (ctx, args) => {
    await generateSessionsLogic(ctx, args.schoolDayId);
  },
});

/**
 * Public version for manual triggers.
 */
export const generateSessionsForDay = mutation({
  args: { schoolDayId: v.id("schoolDays") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);
    await generateSessionsLogic(ctx, args.schoolDayId);
  },
});

/**
 * Gets sessions for a specific date.
 */
export const getSessionsByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("dailySessions")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const results = [];
    for (const session of sessions) {
      const slot = await ctx.db.get(session.scheduleSlotId);
      if (!slot) continue;
      
      const subject = await ctx.db.get(slot.subjectId);
      const teacher = await ctx.db.get(slot.teacherId);
      const homeroom = await ctx.db.get(slot.homeroomId);

      results.push({
        ...session,
        subjectName: subject?.name,
        teacherName: teacher?.name,
        homeroomName: homeroom?.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }
    return results;
  },
});

/**
 * Gets details for a specific session.
 */
export const getDetails = query({
  args: { sessionId: v.id("dailySessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const slot = await ctx.db.get(session.scheduleSlotId);
    if (!slot) return null;

    const subject = await ctx.db.get(slot.subjectId);
    const homeroom = await ctx.db.get(slot.homeroomId);
    const room = homeroom ? await ctx.db.get(homeroom.roomId) : null;

    return {
      ...session,
      subjectName: subject?.name,
      subjectCode: subject?.code,
      homeroomName: homeroom?.name,
      roomName: room?.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
    };
  },
});

/**
 * Gets the current session for a teacher based on time.
 */
export const getCurrentTeacherSession = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const date = new Date(now).toISOString().split("T")[0];
    const dayOfWeek = new Date(now).getDay();
    const timeStr = new Date(now).toTimeString().split(" ")[0].substring(0, 5);

    // 1. Find the current slot
    const slot = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .filter((q) => q.and(
        q.eq(q.field("dayOfWeek"), dayOfWeek),
        q.lte(q.field("startTime"), timeStr),
        q.gte(q.field("endTime"), timeStr)
      ))
      .first();

    if (!slot) return null;

    // 2. Find the daily session
    const session = await ctx.db
      .query("dailySessions")
      .withIndex("by_slot", (q) => q.eq("scheduleSlotId", slot._id))
      .filter((q) => q.eq(q.field("date"), date))
      .unique();

    if (!session) return null;

    const subject = await ctx.db.get(slot.subjectId);
    const homeroom = await ctx.db.get(slot.homeroomId);
    const room = homeroom ? await ctx.db.get(homeroom.roomId) : null;

    // 3. Get attendance counts
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_session", (q) => q.eq("dailySessionId", session._id))
      .collect();

    const present = attendance.filter(a => a.status === "present" || a.status === "late").length;

    return {
      ...session,
      subjectName: subject?.name,
      homeroomName: homeroom?.name,
      roomName: room?.name,
      presentCount: present,
      totalCount: attendance.length,
    };
  },
});
