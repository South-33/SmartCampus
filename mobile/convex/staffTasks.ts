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
    
    // Get Active Semester
    const activeSemester = await ctx.db
      .query("semesters")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .unique();

    // Join with room and homeroom info
    return await Promise.all(tasks.map(async (task) => {
      const room = await ctx.db.get(task.roomId);
      let homeroomName = undefined;
      
      if (activeSemester && room) {
        const homeroom = await ctx.db
          .query("homerooms")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .filter((q) => q.eq(q.field("semesterId"), activeSemester._id))
          .first();
        homeroomName = homeroom?.name;
      }

      return {
        ...task,
        roomName: room?.name || "Unknown Room",
        homeroomName,
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
