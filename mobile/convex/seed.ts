import { action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

const ROOM_DATA = [
  { key: 'lab305', name: 'Computer Lab 305', type: 'academic', lock: 'unlocked', power: 'on' },
  { key: 'lab102', name: 'Bio-Tech Lab 102', type: 'academic', lock: 'locked', power: 'off' },
  { key: 'phys112', name: 'Physics Research 112', type: 'academic', lock: 'staff_only', power: 'on' },
  { key: 'hall201', name: 'Mathematics Hall 201', type: 'academic', lock: 'locked', power: 'off' },
  { key: 'auditorium', name: 'Grand Auditorium', type: 'academic', lock: 'unlocked', power: 'on' },
  { key: 'library', name: 'Central Library', type: 'hub', lock: 'unlocked', power: 'on' },
  { key: 'lounge', name: 'Student Hub', type: 'hub', lock: 'unlocked', power: 'on' },
  { key: 'staff_lounge', name: 'Faculty Lounge', type: 'restricted', lock: 'staff_only', power: 'on' },
  { key: 'maint_hub', name: 'Maintenance Base', type: 'restricted', lock: 'staff_only', power: 'on' },
  { key: 'admin_office', name: 'Administration Office', type: 'restricted', lock: 'locked', power: 'on' },
  { key: 'cafeteria', name: 'Campus Cafeteria', type: 'hub', lock: 'unlocked', power: 'on' },
  { key: 'gym', name: 'Kingsford Gym', type: 'hub', lock: 'locked', power: 'off' },
  { key: 'bath_m', name: 'Mens Washroom (Main)', type: 'bathroom', lock: 'unlocked', power: 'on' },
  { key: 'bath_f', name: 'Womens Washroom (Main)', type: 'bathroom', lock: 'unlocked', power: 'on' },
];


export const seed = action({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Initializing Master Campus Simulation...");

    // 1. Full Wipe
    await ctx.runMutation(internal.seed.clearAllData, {});
    console.log("🧹 Database wiped clean.");

    // 2. Seed Infrastructure
    const roomIds = await ctx.runMutation(internal.seed.seedRooms, {});
    console.log("🏢 12 Rooms established.");

    // 3. Seed Personnel
    const personnel = [
      { email: 'admin@kingsford.edu', name: 'Dean Henderson', role: 'admin' },
      { email: 'sarah.williams@kingsford.edu', name: 'Prof. Sarah Williams', role: 'teacher' },
      { email: 'david.miller@kingsford.edu', name: 'Dr. David Miller', role: 'teacher' },
      { email: 'elena.rodriguez@kingsford.edu', name: 'Prof. Elena Rodriguez', role: 'teacher' },
      { email: 'james.smith@kingsford.edu', name: 'Dr. James Smith', role: 'teacher' },
      { email: 'mike.cleaner@kingsford.edu', name: 'Mike (Cleaning)', role: 'staff' },
      { email: 'robert.maint@kingsford.edu', name: 'Robert (Maintenance)', role: 'staff' },
      { email: 'linda.security@kingsford.edu', name: 'Officer Linda', role: 'staff' },
    ];

    for (const p of personnel) {
      await createAccount(ctx, {
        provider: "password",
        account: { id: p.email, secret: "password123" },
        profile: { email: p.email, name: p.name, role: p.role as any, status: 'active' },
      });
    }

    // 4. Seed Students with Majors & Years
    const students = [
      { email: 'john.doe@kingsford.edu', name: 'John Doe', major: 'Computer Science', year: 'Junior' },
      { email: 'jane.smith@kingsford.edu', name: 'Jane Smith', major: 'Computer Science', year: 'Senior' },
      { email: 'emily.white@kingsford.edu', name: 'Emily White', major: 'Physics', year: 'Freshman' },
      { email: 'chris.green@kingsford.edu', name: 'Chris Green', major: 'Mathematics', year: 'Sophomore' },
      { email: 'alex.brown@kingsford.edu', name: 'Alex Brown', major: 'Engineering', year: 'Senior' },
      { email: 'lisa.jones@kingsford.edu', name: 'Lisa Jones', major: 'Computer Science', year: 'Freshman' },
      { email: 'tom.wilson@kingsford.edu', name: 'Tom Wilson', major: 'Physics', year: 'Junior' },
      { email: 'anna.davis@kingsford.edu', name: 'Anna Davis', major: 'Mathematics', year: 'Senior' },
      { email: 'mark.taylor@kingsford.edu', name: 'Mark Taylor', major: 'Engineering', year: 'Sophomore' },
      { email: 'sophie.lee@kingsford.edu', name: 'Sophie Lee', major: 'Computer Science', year: 'Junior' },
    ];

    for (const s of students) {
      await createAccount(ctx, {
        provider: "password",
        account: { id: s.email, secret: "password123" },
        profile: { 
          email: s.email, 
          name: s.name, 
          role: 'student', 
          status: 'enrolled',
          major: s.major,
          year: s.year,
          cardUID: `04:${Math.random().toString(16).slice(2, 4).toUpperCase()}:${Math.random().toString(16).slice(2, 4).toUpperCase()}:...`
        },
      });
    }

    // 5. Seed Everything Else (Classes, History, Today)
    await ctx.runMutation(internal.seed.seedOperationalData, { roomIds });
    console.log("✅ Simulation Ready.");

    return { success: true };
  }
});

export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = ["users", "authAccounts", "authSessions", "authIdentifiers", "rooms", "classes", "classSessions", "staffTasks", "accessLogs", "auditLogs", "devices"];
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) await ctx.db.delete(doc._id);
    }
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
        gps: { lat: 13.75 + Math.random() * 0.01, lng: 100.5 + Math.random() * 0.01 },
        lockStatus: r.lock as any,
        powerStatus: r.power as any,
        occupancy: Math.floor(Math.random() * 40),
        lastUpdated: Date.now(),
      });
    }
    return ids;
  }
});


export const seedOperationalData = internalMutation({
  args: { roomIds: v.any() },
  handler: async (ctx, { roomIds }) => {
    const teachers = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "teacher")).collect();
    const students = await ctx.db.query("users").filter(q => q.eq(q.field("role"), "student")).collect();
    
    // 1. Create Classes
    const classData = [
      { name: "Data Structures", code: "CS101", teacher: teachers[0]._id, rooms: [roomIds.lab305, roomIds.auditorium] },
      { name: "Calculus II", code: "MATH202", teacher: teachers[1]._id, rooms: [roomIds.hall201] },
      { name: "Intro Physics", code: "PH101", teacher: teachers[2]._id, rooms: [roomIds.phys112, roomIds.auditorium] },
      { name: "Robotics", code: "ENG301", teacher: teachers[3]._id, rooms: [roomIds.lab305, roomIds.phys112] },
    ];

    const classIds: Record<string, any> = {};
    for (const c of classData) {
      classIds[c.code] = await ctx.db.insert("classes", { name: c.name, code: c.code, teacherId: c.teacher });
    }

    // 2. Assign Student Access & Enrollment
    for (const s of students) {
      let allowed = [roomIds.library, roomIds.lounge, roomIds.cafeteria];
      if (s.major === 'Computer Science') allowed.push(roomIds.lab305, roomIds.auditorium);
      if (s.major === 'Physics') allowed.push(roomIds.phys112, roomIds.auditorium);
      if (s.major === 'Mathematics') allowed.push(roomIds.hall201);
      if (s.major === 'Engineering') allowed.push(roomIds.lab305, roomIds.phys112);
      await ctx.db.patch(s._id, { allowedRooms: Array.from(new Set(allowed)) });
    }

    // 3. Generate 7-Day History (Attendance Logs)
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Morning Sessions for History
      for (const s of students) {
        // 90% attendance rate for John Doe, others random
        const present = s.name === "John Doe" ? Math.random() < 0.95 : Math.random() < 0.8;
        if (present) {
          const roomKey = s.major === 'Computer Science' ? 'lab305' : 'hall201';
          await ctx.db.insert("accessLogs", {
            userId: s._id,
            roomId: roomIds[roomKey],
            method: "card",
            action: "ATTENDANCE",
            result: "granted",
            timestamp: date.getTime() + (9 * 3600000) + (Math.random() * 900000), // Around 9:00 AM
            timestampType: "server",
          });
        }
      }
    }

    // 4. Seed Today's Classes
    const todayStr = today.toISOString().split('T')[0];
    const sessions = [
      { code: "CS101", room: roomIds.lab305, start: "09:00", end: "10:30", status: "completed" },
      { code: "MATH202", room: roomIds.hall201, start: "11:00", end: "12:30", status: "completed" },
      { code: "PH101", room: roomIds.phys112, start: "13:30", end: "15:00", status: "ongoing" },
      { code: "ENG301", room: roomIds.lab305, start: "15:30", end: "17:00", status: "upcoming" },
    ];

    for (const sess of sessions) {
      await ctx.db.insert("classSessions", {
        classId: classIds[sess.code],
        roomId: sess.room,
        startTime: sess.start,
        endTime: sess.end,
        date: todayStr,
        status: sess.status as any,
      });
    }

    // 5. Staff Tasks & Devices
    const mike = await ctx.db.query("users").filter(q => q.eq(q.field("email"), "mike.cleaner@kingsford.edu")).unique();
    await ctx.db.insert("staffTasks", { roomId: roomIds.lab305, type: "cleaning", priority: "high", status: "in_progress", description: "Standard lab maintenance", assignedTo: mike?._id, createdAt: Date.now() });

    for (const rKey of Object.keys(roomIds)) {
      await ctx.db.insert("devices", {
        chipId: `DEVICE_${rKey.toUpperCase()}`,
        name: `${rKey} Gateway`,
        roomId: roomIds[rKey],
        status: "online",
        firmwareVersion: "2.1.0",
        lastSeen: Date.now(),
      });
    }
  }
});
