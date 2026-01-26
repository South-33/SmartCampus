import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, mustBeAuthenticated, mustBeTeacherOrAdmin, filterRoomsForUser, logActivity } from "./lib/permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const allRooms = await ctx.db.query("rooms").collect();
    return filterRoomsForUser(user, allRooms);
  },
});

export const cycleLockStatus = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeTeacherOrAdmin(user);

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Cycle: locked -> unlocked -> staff_only -> locked
    let nextStatus: "locked" | "unlocked" | "staff_only" = "locked";
    if (room.lockStatus === "locked") nextStatus = "unlocked";
    else if (room.lockStatus === "unlocked") nextStatus = "staff_only";

    await ctx.db.patch(args.roomId, { lockStatus: nextStatus });
    
    await logActivity(ctx, user!, "LOCK_CYCLE", `Cycled lock for ${room.name} to ${nextStatus}`);

    return { success: true, status: nextStatus };
  },
});
