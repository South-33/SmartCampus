import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/permissions";

/**
 * Lists staff tasks.
 * Auth: Staff see only their assigned tasks. Admins see all tasks.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Only staff and admins can view tasks
    if (user.role !== "staff" && user.role !== "admin") {
      return [];
    }

    let tasks;
    if (user.role === "staff") {
      // Staff only see their own assigned tasks
      tasks = await ctx.db
        .query("staffTasks")
        .filter((q) => q.eq(q.field("assignedTo"), user._id))
        .collect();
    } else {
      // Admins see all tasks
      tasks = await ctx.db.query("staffTasks").collect();
    }
    
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
 * Auth: Staff can only update their own assigned tasks. Admins can update any.
 */
export const updateStatus = mutation({
  args: { 
    taskId: v.id("staffTasks"), 
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")) 
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Unauthorized");

    // Only staff and admins can update tasks
    if (user.role !== "staff" && user.role !== "admin") {
      throw new Error("Only staff or admins can update tasks");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    // Staff can only update their own tasks
    if (user.role === "staff" && task.assignedTo !== user._id) {
      throw new Error("You can only update your own assigned tasks");
    }

    await ctx.db.patch(args.taskId, { status: args.status });
  },
});
