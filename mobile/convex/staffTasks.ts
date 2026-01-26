import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, mustBeAuthenticated } from "./lib/permissions";

/**
 * Lists all staff tasks.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const tasks = await ctx.db.query("staffTasks").collect();
    
    // Join with room info
    return await Promise.all(tasks.map(async (task) => {
      const room = await ctx.db.get(task.roomId);
      return {
        ...task,
        roomName: room?.name || "Unknown Room",
      };
    }));
  },
});

/**
 * Updates a task status.
 */
export const updateStatus = mutation({
  args: { 
    taskId: v.id("staffTasks"), 
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")) 
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    await ctx.db.patch(args.taskId, { status: args.status });
  },
});
