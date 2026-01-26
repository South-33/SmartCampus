import { mutation, query, action } from "./_generated/server";
import { getAuthUserId, createAccount } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") return null;

    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") return [];
    
    return await ctx.db.query("users").collect();
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user?.role !== "admin") return null;

    const users = await ctx.db.query("users").collect();
    return {
      total: users.length,
      students: users.filter(u => u.role === "student").length,
      teachers: users.filter(u => u.role === "teacher").length,
      staff: users.filter(u => u.role === "staff").length,
    };
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
    if (!user || user.role !== "admin") {
      throw new Error("Not authorized");
    }

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

    return newUser._id;
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Not authenticated");
    const admin = await ctx.db.get(userId);
    if (admin?.role !== "admin") throw new Error("Not authorized");

    // Prevent deleting yourself
    if (args.id === userId) throw new Error("Cannot delete your own account");

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
  },
});
