import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getRecent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const logs = await ctx.db
      .query("accessLogs")
      .order("desc")
      .take(10);
    
    return await Promise.all(logs.map(async (log) => {
      const user = await ctx.db.get(log.userId);
      const room = await ctx.db.get(log.roomId);
      return {
        ...log,
        userName: user?.name || "Unknown",
        roomName: room?.name || "Unknown Room",
      };
    }));
  },
});
