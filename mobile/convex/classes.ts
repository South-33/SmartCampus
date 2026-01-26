import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, mustBeAuthenticated } from "./lib/permissions";

/**
 * Lists all classes where the user is the teacher,
 * or all classes if the user is an admin.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    if (user.role === "admin") {
      return await ctx.db.query("classes").collect();
    }

    if (user.role === "teacher") {
      return await ctx.db
        .query("classes")
        .withIndex("by_teacher", (q) => q.eq("teacherId", user._id))
        .collect();
    }

    // Students see classes they are enrolled in? 
    // For now, let's keep it simple as per request.
    return await ctx.db.query("classes").collect();
  },
});

/**
 * Gets sessions for a specific class.
 */
export const getSessions = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    await mustBeAuthenticated(await getCurrentUser(ctx));
    return await ctx.db
      .query("classSessions")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();
  },
});

/**
 * Gets a specific class with its current session info.
 */
export const getDetails = query({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const classDoc = await ctx.db.get(args.classId);
    if (!classDoc) return null;

    const sessions = await ctx.db
      .query("classSessions")
      .withIndex("by_class", (q) => q.eq("classId", args.classId))
      .collect();

    const teacher = await ctx.db.get(classDoc.teacherId);
    const currentSession = sessions.find(s => s.status === "ongoing");

    return {
      ...classDoc,
      teacherName: teacher?.name || "Unknown Teacher",
      sessions,
      currentSession,
    };
  },
});
