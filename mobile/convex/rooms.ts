import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, mustBeAuthenticated, mustBeTeacherOrAdmin, filterRoomsForUser, logActivity } from "./lib/permissions";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const allRooms = await ctx.db.query("rooms").collect();
    const filteredRooms = await filterRoomsForUser(ctx, user, allRooms);

    // Join with homeroom info for the active semester
    const activeSemester = await ctx.db
      .query("semesters")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .unique();

    if (!activeSemester) return filteredRooms;

    const results = [];
    for (const room of filteredRooms) {
      const homeroom = await ctx.db
        .query("homerooms")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .filter((q) => q.eq(q.field("semesterId"), activeSemester._id))
        .first();
      
      results.push({
        ...room,
        homeroomName: homeroom?.name,
      });
    }

    return results;
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

export const markCleaned = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "staff" && user.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.roomId, {
      needsCleaning: false,
      lastCleanedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lastUpdated: Date.now(),
    });

    await logActivity(ctx, user, "ROOM_CLEANED", `Marked room ${args.roomId} as cleaned`);
  },
});

export const setGlobalStatus = mutation({
  args: { 
    lockStatus: v.optional(v.union(v.literal("unlocked"), v.literal("locked"), v.literal("staff_only"))),
    powerStatus: v.optional(v.union(v.literal("on"), v.literal("off")))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") throw new Error("Admin only");

    const rooms = await ctx.db.query("rooms").collect();
    for (const room of rooms) {
      await ctx.db.patch(room._id, {
        ...(args.lockStatus && { lockStatus: args.lockStatus }),
        ...(args.powerStatus && { powerStatus: args.powerStatus }),
        lastUpdated: Date.now(),
      });
    }

    await logActivity(ctx, user, "GLOBAL_OVERRIDE", `Applied global override: ${JSON.stringify(args)}`);
  },
});

export const updateStatus = mutation({
  args: {
    roomId: v.id("rooms"),
    lockStatus: v.optional(v.union(v.literal("unlocked"), v.literal("locked"), v.literal("staff_only"))),
    powerStatus: v.optional(v.union(v.literal("on"), v.literal("off")))
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeTeacherOrAdmin(user);

    const { roomId, ...updates } = args;
    await ctx.db.patch(roomId, {
      ...updates,
      lastUpdated: Date.now(),
    });

    await logActivity(ctx, user!, "ROOM_UPDATE", `Updated room ${roomId}: ${JSON.stringify(updates)}`);
  },
});


