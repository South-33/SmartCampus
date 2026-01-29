import { query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/permissions";
import { Doc, Id } from "./_generated/dataModel";

export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    let logs;
    if (user.role === "student") {
      // Students only see their own logs
      logs = await ctx.db
        .query("accessLogs")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .order("desc")
        .take(50);
    } else {
      // Admins/Teachers see everyone's logs
      logs = await ctx.db
        .query("accessLogs")
        .order("desc")
        .take(50);
    }
    
    return await Promise.all(logs.map(async (log) => {
      const logUser = await ctx.db.get(log.userId);
      const room = await ctx.db.get(log.roomId);
      return {
        ...log,
        userName: logUser?.name || "Unknown",
        roomName: room?.name || "Unknown Room",
      };
    }));
  },
});

/**
 * Calculates attendance metrics for a student.
 */
export const getStudentStats = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    let user: Doc<"users"> | null;
    if (args.userId) {
      user = await ctx.db.get(args.userId);
    } else {
      user = await getCurrentUser(ctx);
    }

    if (!user || user.role !== "student") return null;

    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentId", user!._id))
      .collect();

    // 1. Calculate Overall Percentage
    const expectedClasses = attendanceRecords.length || 1; 
    const attended = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
    const overallPercent = Math.min(100, Math.round((attended / expectedClasses) * 100));

    // 2. Calculate Current Streak
    // We look at the status of the records
    const sortedRecords = [...attendanceRecords].sort((a, b) => b._creationTime - a._creationTime);
    let streak = 0;
    for (const record of sortedRecords) {
      if (record.status === "present" || record.status === "late") {
        streak++;
      } else if (record.status === "absent") {
        break;
      }
      // excused doesn't break nor add to streak in this simple logic
    }

    return {
      currentStreak: streak,
      weekAttended: attended,
      weekTotal: expectedClasses,
      overallPercent,
      status: overallPercent > 75 ? 'good' : 'at_risk',
    };
  },
});
