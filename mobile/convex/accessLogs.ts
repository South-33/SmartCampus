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

    const logs = await ctx.db
      .query("accessLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("action"), "ATTENDANCE"))
      .collect();

    // 1. Calculate Overall Percentage
    const expectedClasses = 14; 
    const attended = logs.length;
    const overallPercent = Math.min(100, Math.round((attended / expectedClasses) * 100));

    // 2. Calculate Current Streak
    const attendedDays = new Set(logs.map(l => new Date(l.timestamp).toISOString().split('T')[0]));
    const checkDate = new Date();
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(checkDate);
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      
      if (attendedDays.has(dStr)) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }

    return {
      currentStreak: streak,
      weekAttended: logs.filter(l => l.timestamp > Date.now() - 7 * 86400000).length,
      weekTotal: expectedClasses,
      overallPercent,
      status: overallPercent > 75 ? 'good' : 'at_risk',
    };
  },
});
