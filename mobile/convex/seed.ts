import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const ROOM_DATA = [
  { key: 'room101', name: 'Homeroom 101', type: 'academic', lock: 'unlocked', power: 'on' },
  { key: 'room102', name: 'Homeroom 102', type: 'academic', lock: 'locked', power: 'off' },
  { key: 'room201', name: 'Homeroom 201', type: 'academic', lock: 'staff_only', power: 'on' },
  { key: 'lab305', name: 'Computer Lab 305', type: 'academic', lock: 'unlocked', power: 'on' },
  { key: 'library', name: 'Central Library', type: 'hub', lock: 'unlocked', power: 'on' },
  { key: 'cafeteria', name: 'Campus Cafeteria', type: 'hub', lock: 'unlocked', power: 'on' },
];

export const seed = action({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Initializing Master Campus Simulation...");

    // 1. Full Wipe
    await ctx.runMutation(internal.seed.clearAllData, {});
    console.log("🧹 Database wiped clean.");

    // 2. Create Semester
    const semesterId = await ctx.runMutation(internal.seed.seedSemester, {});
    console.log("📅 Fall 2026 Semester created.");

    // 3. Create Rooms
    const roomIds = await ctx.runMutation(internal.seed.seedRooms, {});
    console.log("🏢 Rooms established.");

    // 4. Create Subjects
    const subjectIds = await ctx.runMutation(internal.seed.seedSubjects, {});
    console.log("📚 Subjects created.");

    // 5. Create Personnel (Admin, Teachers)
    const teachers = [
      { email: 'sarah.williams@kingsford.edu', name: 'Sarah Williams' },
      { email: 'david.miller@kingsford.edu', name: 'David Miller' },
    ];
    const teacherIds = [];
    for (const t of teachers) {
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: { id: t.email, secret: "password123" },
        profile: { email: t.email, name: t.name, role: 'teacher', status: 'active' },
      });
      teacherIds.push(user._id);
    }
    
    await createAccount(ctx, {
      provider: "password",
      account: { id: 'admin@kingsford.edu', secret: "password123" },
      profile: { email: 'admin@kingsford.edu', name: 'Dean Henderson', role: 'admin', status: 'active' },
    });

    // 6. Create Students & Enroll in Homerooms
    const homerooms = [
      { roomId: roomIds.room101, name: "Grade 10A", students: [
        { email: 'john.doe@kingsford.edu', name: 'John Doe' },
        { email: 'jane.smith@kingsford.edu', name: 'Jane Smith' },
      ]},
      { roomId: roomIds.room102, name: "Grade 11B", students: [
        { email: 'emily.white@kingsford.edu', name: 'Emily White' },
        { email: 'chris.green@kingsford.edu', name: 'Chris Green' },
      ]}
    ];

    for (const hr of homerooms) {
      const hrId = await ctx.runMutation(internal.seed.createHomeroom, {
        roomId: hr.roomId,
        semesterId,
        name: hr.name,
      });

      for (const s of hr.students) {
        const { user } = await createAccount(ctx, {
          provider: "password",
          account: { id: s.email, secret: "password123" },
          profile: { 
            email: s.email, 
            name: s.name, 
            role: 'student', 
            status: 'enrolled',
            cardUID: `04:${Math.random().toString(16).slice(2, 4).toUpperCase()}:${Math.random().toString(16).slice(2, 4).toUpperCase()}`
          },
        });
        await ctx.runMutation(internal.seed.enrollStudentInHomeroom, {
          homeroomId: hrId,
          studentId: user._id,
        });
      }

      // 7. Create Schedule Slots for Homerooms
      await ctx.runMutation(internal.seed.seedSchedule, {
        homeroomId: hrId,
        subjectId: subjectIds.math,
        teacherId: teacherIds[0],
        dayOfWeek: 1, // Mon
        startTime: "09:00",
        endTime: "10:30",
      });
      await ctx.runMutation(internal.seed.seedSchedule, {
        homeroomId: hrId,
        subjectId: subjectIds.cs,
        teacherId: teacherIds[1],
        dayOfWeek: 1, // Mon
        startTime: "11:00",
        endTime: "12:30",
      });
    }

    // 8. Generate Daily Sessions for Today (assuming today is a school day in seed)
    await ctx.runMutation(internal.seed.generateTodaySessions, { semesterId });

    console.log("✅ Simulation Ready.");
    return { success: true };
  }
});

export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "users", "authAccounts", "authSessions", "authIdentifiers", 
      "rooms", "semesters", "schoolDays", "homerooms", "homeroomStudents",
      "subjects", "scheduleSlots", "dailySessions", "attendance",
      "staffTasks", "accessLogs", "auditLogs", "devices"
    ];
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) await ctx.db.delete(doc._id);
    }
  }
});

export const seedSemester = internalMutation({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.db.insert("semesters", {
      name: "Fall 2026",
      startDate: "2026-08-01",
      endDate: "2026-12-31",
      status: "active",
    });
    // Create today as a school day
    const today = new Date().toISOString().split('T')[0];
    await ctx.db.insert("schoolDays", {
      semesterId: id,
      date: today,
      dayType: "regular",
    });
    return id;
  }
});

export const seedRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ids: Record<string, any> = {};
    for (const r of ROOM_DATA) {
      ids[r.key] = await ctx.db.insert("rooms", {
        name: r.name,
        type: r.type as any,
        gps: { lat: 13.75, lng: 100.5 },
        lockStatus: r.lock as any,
        powerStatus: r.power as any,
        occupancy: 0,
        lastUpdated: Date.now(),
      });
    }
    return ids;
  }
});

export const seedSubjects = internalMutation({
  args: {},
  handler: async (ctx) => {
    const math = await ctx.db.insert("subjects", { name: "Mathematics", code: "MATH101" });
    const cs = await ctx.db.insert("subjects", { name: "Computer Science", code: "CS101" });
    return { math, cs };
  }
});

export const createHomeroom = internalMutation({
  args: { roomId: v.id("rooms"), semesterId: v.id("semesters"), name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("homerooms", {
      roomId: args.roomId,
      semesterId: args.semesterId,
      name: args.name,
    });
  }
});

export const enrollStudentInHomeroom = internalMutation({
  args: { homeroomId: v.id("homerooms"), studentId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.insert("homeroomStudents", {
      homeroomId: args.homeroomId,
      studentId: args.studentId,
      enrolledAt: Date.now(),
      status: "active",
    });
    await ctx.db.patch(args.studentId, { currentHomeroomId: args.homeroomId });
  }
});

export const seedSchedule = internalMutation({
  args: {
    homeroomId: v.id("homerooms"),
    subjectId: v.id("subjects"),
    teacherId: v.id("users"),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("scheduleSlots", {
      homeroomId: args.homeroomId,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
    });
  }
});

export const generateTodaySessions = internalMutation({
  args: { semesterId: v.id("semesters") },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    const schoolDay = await ctx.db
      .query("schoolDays")
      .withIndex("by_date", q => q.eq("date", today))
      .filter(q => q.eq(q.field("semesterId"), args.semesterId))
      .unique();
    
    if (!schoolDay) return;

    const dayOfWeek = new Date().getDay();
    const slots = await ctx.db
      .query("scheduleSlots")
      .withIndex("by_day", q => q.eq("dayOfWeek", dayOfWeek))
      .collect();

    for (const slot of slots) {
      const sessionId = await ctx.db.insert("dailySessions", {
        scheduleSlotId: slot._id,
        schoolDayId: schoolDay._id,
        date: today,
        status: "upcoming",
        windowStart: Date.now() - 3600000,
        windowEnd: Date.now() + 3600000,
      });

      const enrollments = await ctx.db
        .query("homeroomStudents")
        .withIndex("by_homeroom", q => q.eq("homeroomId", slot.homeroomId))
        .filter(q => q.eq(q.field("status"), "active"))
        .collect();

      for (const enroll of enrollments) {
        await ctx.db.insert("attendance", {
          dailySessionId: sessionId,
          studentId: enroll.studentId,
          status: "absent",
          markedManually: false,
        });
      }
    }
  }
});
