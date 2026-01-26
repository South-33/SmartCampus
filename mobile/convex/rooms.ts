import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    return await ctx.db.query("rooms").collect();
  },
});

export const cycleLockStatus = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    // This would send a command to the ESP32 in a real app
    // For now we just return success
    return { success: true };
  },
});
