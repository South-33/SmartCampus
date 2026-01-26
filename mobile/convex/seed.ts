import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createAccount } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

export const seed = action({
  args: {},
  handler: async (ctx) => {
    // 1. Clear ALL data first
    await ctx.runMutation(internal.seed.clearAllData, {});

    // 2. Create Rooms via mutation (so we get IDs)
    const roomIds = await ctx.runMutation(internal.seed.seedRooms, {});

    // 3. Create Auth Accounts
    const users = [
      { email: 'admin@kingsford.edu', name: 'Admin User', role: 'admin', status: 'active' },
      { email: 'sarah.williams@kingsford.edu', name: 'Prof. Sarah Williams', role: 'teacher', status: 'active' },
      { email: 'john.doe@kingsford.edu', name: 'John Doe', role: 'student', status: 'enrolled', allowedRooms: [roomIds.room1, roomIds.room2, roomIds.room3] },
      { email: 'mike.miller@kingsford.edu', name: 'Mike Miller', role: 'staff', status: 'active' },
    ];

    for (const u of users) {
      await createAccount(ctx, {
        provider: "password",
        account: {
          id: u.email,
          secret: "password123",
        },
        profile: {
          email: u.email,
          name: u.name,
          role: u.role as any,
          status: u.status as any,
          allowedRooms: u.allowedRooms,
        },
      });
      console.log(`Created account for ${u.email}`);
    }

    // 4. Seed Classes and Sessions
    await ctx.runMutation(internal.seed.seedClassesAndSessions, {});

    return { success: true };
  }
});

export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["users", "authAccounts", "authSessions", "authIdentifiers", "rooms", "classes", "classSessions", "staffTasks", "accessLogs", "auditLogs", "devices"];
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }
  }
});

export const seedRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const roomIds: Record<string, any> = {};
    const rooms = [
      { key: 'room1', name: 'Computer Lab 305', gps: { lat: 13.7563, lng: 100.5018 }, lockStatus: "unlocked", powerStatus: "on", occupancy: 12 },
      { key: 'room2', name: 'Seminar Room 408', gps: { lat: 13.7565, lng: 100.5020 }, lockStatus: "locked", powerStatus: "off", occupancy: 0 },
      { key: 'room3', name: 'Physics Lab 112', gps: { lat: 13.7560, lng: 100.5015 }, lockStatus: "staff_only", powerStatus: "on", occupancy: 5 },
    ];

    for (const r of rooms) {
      const id = await ctx.db.insert("rooms", {
        name: r.name,
        gps: r.gps,
        lockStatus: r.lockStatus as any,
        powerStatus: r.powerStatus as any,
        occupancy: r.occupancy,
        lastUpdated: Date.now(),
      });
      roomIds[r.key] = id;
    }
    return roomIds;
  }
});

export const seedClassesAndSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const teacher = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", "sarah.williams@kingsford.edu")).unique();
    const room1 = await ctx.db.query("rooms").filter(q => q.eq(q.field("name"), "Computer Lab 305")).unique();
    
    if (teacher && room1) {
      const classId = await ctx.db.insert("classes", {
        name: "Data Structures",
        code: "CS101",
        teacherId: teacher._id,
      });

      await ctx.db.insert("classSessions", {
        classId,
        roomId: room1._id,
        startTime: "09:00",
        endTime: "10:30",
        date: new Date().toISOString().split('T')[0],
        status: "ongoing",
      });
    }
  }
});
