import { mutation, query, action } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { getCurrentUser, mustBeAdmin, mustBeAuthenticated, logActivity, touchRoom } from "./lib/permissions";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    mustBeAdmin(user);
    
    return await ctx.db.query("users").collect();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return { total: 0, students: 0, teachers: 0, staff: 0 };
    mustBeAdmin(user);

    const users = await ctx.db.query("users").collect();
    return {
      total: users.length,
      students: users.filter(u => u.role === "student").length,
      teachers: users.filter(u => u.role === "teacher").length,
      staff: users.filter(u => u.role === "staff").length,
    };
  },
});

/**
 * Admin-only user creation
 */
export const create = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("admin"),
      v.literal("staff")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.viewer);
    mustBeAdmin(user);

    const existingUser = await ctx.runQuery(api.users.getUserByEmail, {
      email: args.email,
    });
    if (existingUser) throw new Error("User already exists");

    const { user: newUser } = await createAccount(ctx, {
      provider: "password",
      account: {
        id: args.email,
        secret: args.password,
      },
      profile: {
        email: args.email,
        name: args.name,
        role: args.role,
        status: "active",
      },
    });

    await ctx.runMutation(api.users.internalLogActivity, {
      action: "USER_CREATE",
      description: `Created user ${args.name} (${args.email}) with role ${args.role}`,
    });

    return newUser._id;
  },
});

/**
 * Link a device to a user (Anti-sharing)
 * Should be called when the user first logs in on a device.
 */
export const updateDeviceId = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAuthenticated(user);

    // Hard Anti-Sharing: If deviceId is already set, prevent change.
    // In a real school, a student would need to visit the admin to reset this.
    if (user!.deviceId && user!.deviceId !== args.deviceId) {
      throw new Error("Device already linked. Please contact an administrator to change your device.");
    }

    await ctx.db.patch(user!._id, { deviceId: args.deviceId });
    await logActivity(ctx, user!, "DEVICE_LINK", `Linked device ${args.deviceId}`);
  },
});

/**
 * Link an NFC Card to the current user
 */
export const linkCard = mutation({
  args: { cardUID: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAuthenticated(user);

    // Check if card is already in use
    const existing = await ctx.db
      .query("users")
      .withIndex("by_cardUID", (q) => q.eq("cardUID", args.cardUID))
      .unique();

    if (existing && existing._id !== user!._id) {
      throw new Error("This card is already linked to another account.");
    }

    await ctx.db.patch(user!._id, { cardUID: args.cardUID });
    await logActivity(ctx, user!, "CARD_LINK", `Linked card ${args.cardUID}`);

    // If student, touch their rooms so hardware re-syncs
    if (user!.role === "student" && user!.allowedRooms) {
      for (const roomId of user!.allowedRooms) {
        await touchRoom(ctx, roomId);
      }
    }
  },
});

export const remove = mutation({

  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    mustBeAdmin(admin);

    // Prevent deleting yourself
    if (args.id === admin!._id) throw new Error("Cannot delete your own account");

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    // 1. Delete user profile
    await ctx.db.delete(args.id);

    // 2. Delete related auth accounts
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", args.id))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // 3. Delete related sessions
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", args.id))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    await logActivity(ctx, admin!, "USER_DELETE", `Deleted user ${user.name} (${user.email})`);
  },
});

/**
 * Admin-only user update (Role, Status, Allowed Rooms)
 */
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("admin"),
      v.literal("staff")
    )),
    status: v.optional(v.union(
      v.literal("enrolled"),
      v.literal("graduated"),
      v.literal("expelled"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("temporary")
    )),
    allowedRooms: v.optional(v.array(v.id("rooms"))),
  },
  handler: async (ctx, args) => {
    const admin = await getCurrentUser(ctx);
    mustBeAdmin(admin);

    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);

    // If allowedRooms changed, touch the rooms
    if (args.allowedRooms || args.role || args.status) {
      // Touch old rooms
      if (user.allowedRooms) {
        for (const roomId of user.allowedRooms) await touchRoom(ctx, roomId);
      }
      // Touch new rooms
      if (args.allowedRooms) {
        for (const roomId of args.allowedRooms) await touchRoom(ctx, roomId);
      }
    }

    await logActivity(ctx, admin!, "USER_UPDATE", `Updated user ${user.name}`);
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const internalLogActivity = mutation({
  args: { action: v.string(), description: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return;
    await logActivity(ctx, user, args.action, args.description);
  },
});
