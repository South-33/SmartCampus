import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, mustBeAdmin, logActivity, touchRoom } from "./lib/permissions";
import { hashToken } from "./hardware";

/**
 * Lists all devices for the admin dashboard.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    mustBeAdmin(user);
    
    return await ctx.db.query("devices").collect();
  },
});

/**
 * Assigns a device to a room and resets its status.
 */
export const assignToRoom = mutation({
  args: { 
    deviceId: v.id("devices"), 
    roomId: v.id("rooms") 
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    mustBeAdmin(admin);

    const device = await ctx.db.get(args.deviceId);
    const room = await ctx.db.get(args.roomId);

    if (!device || !room) throw new Error("Device or Room not found");

    await ctx.db.patch(args.deviceId, { 
      roomId: args.roomId,
      status: "active" 
    });

    // Mark the room as updated so the device pulls the whitelist immediately
    await touchRoom(ctx, args.roomId);

    await logActivity(ctx, admin!, "DEVICE_ASSIGN", `Assigned device ${device.chipId} to room ${room.name}`);
  },
});

/**
 * Resets a device token and returns the new one.
 * Useful if the hardware loses its token or is compromised.
 */
export const resetToken = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    mustBeAdmin(admin);

    const device = await ctx.db.get(args.deviceId);
    if (!device) throw new Error("Device not found");

    // Generate a secure random token
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const token = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");

    const tokenHash = await hashToken(token);
    await ctx.db.patch(args.deviceId, { tokenHash: tokenHash });
    
    await logActivity(ctx, admin!, "DEVICE_TOKEN_RESET", `Reset token for device ${device.chipId}`);
    
    return { token };
  },
});
