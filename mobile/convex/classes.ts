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

/**
 * Gets all class sessions scheduled for today.
 */
export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const today = new Date().toISOString().split('T')[0];
    const sessions = await ctx.db
      .query("classSessions")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();

    // Filter by student's allowed rooms or teacher's classes
    const filtered = sessions.filter(s => {
      if (user.role === "admin") return true;
      if (user.role === "teacher") return true; // Could filter by teacherId
      if (user.role === "student") return user.allowedRooms?.includes(s.roomId);
      return false;
    });

    return await Promise.all(filtered.map(async (s) => {
      const classDoc = await ctx.db.get(s.classId);
      const room = await ctx.db.get(s.roomId);
      return {
        ...s,
        className: classDoc?.name || "Unknown Class",
        roomName: room?.name || "Unknown Room",
      };
    }));
  },
});

/**
 * Lists all classes where the student is enrolled.
 */
export const getEnrolled = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "student") return [];

    const allClasses = await ctx.db.query("classes").collect();
    
    // Simplistic: if student has access to ANY of the class's rooms, they are "enrolled"
    // In a real system, you'd have an enrollment table.
    const enrolled = await Promise.all(allClasses.map(async (c) => {
      const sessions = await ctx.db
        .query("classSessions")
        .withIndex("by_class", (q) => q.eq("classId", c._id))
        .collect();
      
      const hasAccess = sessions.some(s => user.allowedRooms?.includes(s.roomId));
      
      if (!hasAccess) return null;

      const teacher = await ctx.db.get(c.teacherId);
      const nextSession = sessions.find(s => s.status === "upcoming" || s.status === "ongoing");
      const nextRoom = nextSession ? await ctx.db.get(nextSession.roomId) : null;

      return {
        ...c,
        professor: teacher?.name || "Unknown",
        nextClass: nextSession ? {
          day: nextSession.date,
          time: nextSession.startTime,
          room: nextRoom?.name || "Unknown",
        } : null,
      };
    }));

    return enrolled.filter(c => c !== null);
  },
});


