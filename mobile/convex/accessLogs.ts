import { query } from "./_generated/server";
import { getCurrentUser } from "./lib/permissions";

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
