import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, mustBeAdmin } from "./lib/permissions";

/**
 * Returns the currently active semester.
 */
export const getActiveSemester = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("semesters")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .unique();
  },
});

/**
 * Creates a new semester and optionally generates school days.
 */
export const createSemester = mutation({
  args: {
    name: v.string(),
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(),
    status: v.union(v.literal("active"), v.literal("upcoming"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    const semesterId = await ctx.db.insert("semesters", {
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      status: args.status,
    });

    return semesterId;
  },
});

/**
 * Lists all semesters.
 */
export const listSemesters = query({
  handler: async (ctx) => {
    return await ctx.db.query("semesters").order("desc").collect();
  },
});

/**
 * Helper to generate school days for a semester.
 * Skips weekends by default.
 */
export const generateSchoolDays = mutation({
  args: {
    semesterId: v.id("semesters"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    const semester = await ctx.db.get(args.semesterId);
    if (!semester) throw new Error("Semester not found");

    const start = new Date(semester.startDate);
    const end = new Date(semester.endDate);
    
    let current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = current.toISOString().split("T")[0];
        
        // Check if day already exists
        const existing = await ctx.db
          .query("schoolDays")
          .withIndex("by_date", (q) => q.eq("date", dateStr))
          .filter((q) => q.eq(q.field("semesterId"), args.semesterId))
          .first();

        if (!existing) {
          await ctx.db.insert("schoolDays", {
            semesterId: args.semesterId,
            date: dateStr,
            dayType: "regular",
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }
  },
});

/**
 * Gets school days for a semester.
 */
export const getSchoolDays = query({
  args: { semesterId: v.id("semesters") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("schoolDays")
      .withIndex("by_semester", (q) => q.eq("semesterId", args.semesterId))
      .collect();
  },
});

/**
 * Marks a specific date as a holiday.
 */
export const markHoliday = mutation({
  args: {
    date: v.string(), // "YYYY-MM-DD"
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    const schoolDay = await ctx.db
      .query("schoolDays")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (schoolDay) {
      await ctx.db.patch(schoolDay._id, {
        dayType: "holiday",
        holidayName: args.name,
      });

      // Cancel any sessions for this day
      const sessions = await ctx.db
        .query("dailySessions")
        .withIndex("by_date", (q) => q.eq("date", args.date))
        .collect();

      for (const session of sessions) {
        await ctx.db.patch(session._id, { status: "cancelled" });
      }

      return schoolDay._id;
    }

    // Create new holiday entry if no schoolDay exists for active semester
    const activeSemester = await ctx.db
      .query("semesters")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .unique();

    if (!activeSemester) throw new Error("No active semester found to link holiday");

    return await ctx.db.insert("schoolDays", {
      semesterId: activeSemester._id,
      date: args.date,
      dayType: "holiday",
      holidayName: args.name,
    });
  },
});

/**
 * Checks if a given date is a school day.
 */
export const isSchoolDay = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const date = new Date(args.date);
    const dayOfWeek = date.getDay();

    // Weekends are never school days
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isSchoolDay: false, reason: "weekend" };
    }

    const schoolDay = await ctx.db
      .query("schoolDays")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (!schoolDay) {
      return { isSchoolDay: true, reason: "regular" }; // Assume school day if not specified
    }

    if (schoolDay.dayType === "holiday") {
      return { isSchoolDay: false, reason: schoolDay.holidayName || "holiday" };
    }

    return { isSchoolDay: true, reason: schoolDay.dayType };
  },
});
