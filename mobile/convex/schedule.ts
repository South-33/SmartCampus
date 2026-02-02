import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, mustBeAdmin } from "./lib/permissions";

/**
 * Helper to validate time format (HH:MM)
 */
function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(time);
}

/**
 * Creates a new subject.
 */
export const createSubject = mutation({
  args: { name: v.string(), code: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);
    return await ctx.db.insert("subjects", { name: args.name, code: args.code });
  },
});

/**
 * Lists all subjects.
 */
export const listSubjects = query({
  handler: async (ctx) => {
    return await ctx.db.query("subjects").collect();
  },
});

/**
 * Adds a slot to a homeroom's weekly schedule.
 */
export const addSlot = mutation({
  args: {
    homeroomId: v.id("homerooms"),
    subjectId: v.id("subjects"),
    teacherId: v.id("users"),
    dayOfWeek: v.number(), // 1=Mon, 5=Fri
    startTime: v.string(), // "HH:MM"
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    // Validate time format
    if (!isValidTimeFormat(args.startTime) || !isValidTimeFormat(args.endTime)) {
      throw new Error("Invalid time format. Use HH:MM (24-hour)");
    }
    
    // Validate startTime < endTime
    if (args.startTime >= args.endTime) {
      throw new Error("Start time must be before end time");
    }

    return await ctx.db.insert("scheduleSlots", {
      homeroomId: args.homeroomId,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
    });
  },
});

/**
 * Gets the weekly schedule for a homeroom.
 * Auth: Must be authenticated. Students can only view their own homeroom's schedule.
 */
export const getHomeroomSchedule = query({
  args: { homeroomId: v.id("homerooms") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Students can only view their own homeroom's schedule
    if (user.role === "student") {
      const enrollment = await ctx.db
        .query("homeroomStudents")
        .withIndex("by_student", (q) => q.eq("studentId", user._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .first();
      
      if (!enrollment || enrollment.homeroomId !== args.homeroomId) {
        return [];
      }
    }

    const slots = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_homeroom", (q) => q.eq("homeroomId", args.homeroomId))
      .collect();

    const results = [];
    for (const slot of slots) {
      const subject = await ctx.db.get(slot.subjectId);
      const teacher = await ctx.db.get(slot.teacherId);
      results.push({
        ...slot,
        subjectName: subject?.name,
        teacherName: teacher?.name,
      });
    }
    return results;
  },
});

/**
 * Gets the schedule for a teacher.
 * Auth: Must be authenticated. Teachers can only view their own schedule.
 *       Admins can view any teacher's schedule.
 */
export const getTeacherSchedule = query({
  args: { teacherId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Teachers can only view their own schedule (admins can view any)
    if (user.role === "teacher" && user._id !== args.teacherId) {
      return [];
    }
    // Students and staff cannot view teacher schedules directly
    if (user.role === "student" || user.role === "staff") {
      return [];
    }

    const slots = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_teacher", (q) => q.eq("teacherId", args.teacherId))
      .collect();

    const results = [];
    for (const slot of slots) {
      const homeroom = await ctx.db.get(slot.homeroomId);
      const subject = await ctx.db.get(slot.subjectId);
      results.push({
        ...slot,
        homeroomName: homeroom?.name,
        subjectName: subject?.name,
      });
    }
    return results;
  },
});

/**
 * Updates an existing schedule slot.
 */
export const updateSlot = mutation({
  args: {
    slotId: v.id("scheduleSlots"),
    subjectId: v.optional(v.id("subjects")),
    teacherId: v.optional(v.id("users")),
    dayOfWeek: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);
    
    const { slotId, ...updates } = args;
    const slot = await ctx.db.get(slotId);
    if (!slot) throw new Error("Schedule slot not found");
    
    // Validate time formats if provided
    if (updates.startTime && !isValidTimeFormat(updates.startTime)) {
      throw new Error("Invalid start time format. Use HH:MM");
    }
    if (updates.endTime && !isValidTimeFormat(updates.endTime)) {
      throw new Error("Invalid end time format. Use HH:MM");
    }
    
    // Validate startTime < endTime
    const finalStart = updates.startTime ?? slot.startTime;
    const finalEnd = updates.endTime ?? slot.endTime;
    if (finalStart >= finalEnd) {
      throw new Error("Start time must be before end time");
    }
    
    await ctx.db.patch(slotId, updates);
    return { success: true };
  },
});

/**
 * Deletes a schedule slot and cancels future sessions.
 */
export const deleteSlot = mutation({
  args: { slotId: v.id("scheduleSlots") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);
    
    const slot = await ctx.db.get(args.slotId);
    if (!slot) throw new Error("Schedule slot not found");
    
    // Cancel any future sessions for this slot
    const todayStr = new Date().toISOString().split("T")[0];
    const futureSessions = await ctx.db
      .query("dailySessions")
      .withIndex("by_slot", q => q.eq("scheduleSlotId", args.slotId))
      .filter(q => q.gte(q.field("date"), todayStr))
      .collect();
    
    for (const session of futureSessions) {
      if (session.status !== "closed") {
        await ctx.db.patch(session._id, { status: "cancelled" });
      }
    }
    
    await ctx.db.delete(args.slotId);
    return { success: true, cancelledSessions: futureSessions.length };
  },
});
