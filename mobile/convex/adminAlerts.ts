import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser, mustBeAdmin } from "./lib/permissions";

/**
 * Gets active alerts for a specific user.
 * Utilizes the by_user_status compound index.
 */
export const getAlertsForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    // Security: Only allow users to see their own alerts, or admins to see any
    if (user.role !== "admin" && user._id !== args.userId) {
      return [];
    }

    return await ctx.db
      .query("adminAlerts")
      .withIndex("by_user_status", (q) => 
        q.eq("userId", args.userId).eq("status", "active")
      )
      .collect();
  },
});

/**
 * Lists all active alerts for admins.
 */
export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    return await ctx.db
      .query("adminAlerts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
  },
});

/**
 * Resolves an alert.
 */
export const resolve = mutation({
  args: { 
    alertId: v.id("adminAlerts") 
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    await ctx.db.patch(args.alertId, {
      status: "resolved",
      resolvedAt: Date.now(),
      resolvedBy: user!._id,
    });
  },
});
