import { internalAction, internalMutation } from "./_generated/server";
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

const STUDENT_NAMES = [
  { f: "Liam", l: "Smith" }, { f: "Olivia", l: "Johnson" }, { f: "Noah", l: "Williams" },
  { f: "Emma", l: "Brown" }, { f: "Oliver", l: "Jones" }, { f: "Ava", l: "Garcia" },
  { f: "Elijah", l: "Miller" }, { f: "Charlotte", l: "Davis" }, { f: "William", l: "Rodriguez" },
  { f: "Sophia", l: "Martinez" }, { f: "James", l: "Hernandez" }, { f: "Amelia", l: "Lopez" },
  { f: "Benjamin", l: "Gonzalez" }, { f: "Isabella", l: "Wilson" }, { f: "Lucas", l: "Anderson" },
  { f: "Mia", l: "Thomas" }, { f: "Henry", l: "Taylor" }, { f: "Evelyn", l: "Moore" },
  { f: "Theodore", l: "Jackson" }, { f: "Harper", l: "Martin" }, { f: "Alexander", l: "Lee" },
  { f: "Luna", l: "Perez" }, { f: "Jackson", l: "Thompson" }, { f: "Camila", l: "White" },
  { f: "Sebastian", l: "Harris" }, { f: "Gianna", l: "Sanchez" }, { f: "Jack", l: "Clark" },
  { f: "Elizabeth", l: "Ramirez" }, { f: "Aiden", l: "Lewis" }, { f: "Eleanor", l: "Robinson" },
  { f: "Owen", l: "Walker" }, { f: "Ella", l: "Young" }, { f: "Samuel", l: "Allen" },
  { f: "Abigail", l: "King" }, { f: "Matthew", l: "Wright" }, { f: "Sofia", l: "Scott" },
  { f: "Joseph", l: "Torres" }, { f: "Avery", l: "Nguyen" }, { f: "Levi", l: "Hill" },
  { f: "Scarlett", l: "Flores" }, { f: "Mateo", l: "Green" }, { f: "Emily", l: "Adams" },
  { f: "David", l: "Nelson" }, { f: "Aria", l: "Baker" }, { f: "John", l: "Hall" },
  { f: "Penelope", l: "Rivera" }, { f: "Wyatt", l: "Campbell" }, { f: "Chloe", l: "Mitchell" },
  { f: "Carter", l: "Carter" }, { f: "Layla", l: "Roberts" }
];

const MAJORS = ["Computer Science", "Physics", "Mathematics", "Engineering"];
const YEARS = ["Freshman", "Sophomore", "Junior", "Senior"];

export const seed = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("🚀 Initializing High-Fidelity Campus Simulation (50+ Accounts)...");

    // 1. Full Wipe
    await ctx.runMutation(internal.seed.clearAllData, {});
    console.log("🧹 Database wiped clean.");

    // 2. Seed Infrastructure
    const semesterId = await ctx.runMutation(internal.seed.seedSemester, {});
    const roomIds = await ctx.runMutation(internal.seed.seedRooms, {});
    const subjectIds = await ctx.runMutation(internal.seed.seedSubjects, {});
    console.log("🏢 Infrastructure & Subjects established.");

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

    const teacherIds = [];
    for (const p of personnel) {
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: { id: p.email, secret: "password123" },
        profile: { email: p.email, name: p.name, role: p.role as any, status: 'active' },
      });
      if (p.role === 'teacher') teacherIds.push(user._id);
    }
    console.log("👨‍🏫 Personnel accounts created.");

    // 4. Seed Students (50 deterministic accounts)
    const studentIds = [];
    for (let i = 0; i < STUDENT_NAMES.length; i++) {
      const name = STUDENT_NAMES[i];
      const fullName = `${name.f} ${name.l}`;
      const email = `${name.f.toLowerCase()}.${name.l.toLowerCase()}@kingsford.edu`;
      const major = MAJORS[i % MAJORS.length];
      const year = YEARS[i % YEARS.length];
      
      const { user } = await createAccount(ctx, {
        provider: "password",
        account: { id: email, secret: "password123" },
        profile: { 
          email, 
          name: fullName, 
          role: 'student', 
          status: 'enrolled',
          major,
          year,
          cardUID: `04:${(i+10).toString(16).toUpperCase()}:${(i+20).toString(16).toUpperCase()}:AF`
        },
      });
      studentIds.push(user._id);
    }
    console.log("🎓 50 Student accounts created.");

    // 5. Seed Operational Data (Enrollment, Schedule, Logs)
    await ctx.runMutation(internal.seed.seedOperationalData, { 
      roomIds, semesterId, subjectIds, teacherIds, studentIds 
    });
    
    console.log("✅ High-Fidelity Simulation Ready.");
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
        gps: { lat: 13.75 + (Math.random() * 0.001), lng: 100.5 + (Math.random() * 0.001) },
        lockStatus: r.lock as any,
        powerStatus: r.power as any,
        occupancy: Math.floor(Math.random() * 30),
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
    const phys = await ctx.db.insert("subjects", { name: "Physics", code: "PHYS101" });
    const eng = await ctx.db.insert("subjects", { name: "Engineering", code: "ENG101" });
    return { math, cs, phys, eng };
  }
});

export const seedOperationalData = internalMutation({
  args: { 
    roomIds: v.any(), 
    semesterId: v.id("semesters"),
    subjectIds: v.any(),
    teacherIds: v.array(v.id("users")),
    studentIds: v.array(v.id("users"))
  },
  handler: async (ctx, args) => {
    const { roomIds, semesterId, subjectIds, teacherIds, studentIds } = args;

    // 1. Create 4 Homerooms
    const hrConfigs = [
      { key: 'hr101', name: "Grade 10A", roomId: roomIds.hall201 },
      { key: 'hr102', name: "Grade 11B", roomId: roomIds.lab102 },
      { key: 'hr103', name: "Grade 12C", roomId: roomIds.phys112 },
      { key: 'hr104', name: "CS Alpha", roomId: roomIds.lab305 },
    ];

    const hrIds: Record<string, any> = {};
    for (const config of hrConfigs) {
      hrIds[config.key] = await ctx.db.insert("homerooms", {
        roomId: config.roomId,
        semesterId,
        name: config.name,
      });
    }

    // 2. Enroll Students (12-13 per homeroom)
    for (let i = 0; i < studentIds.length; i++) {
      const hrKey = `hr10${(i % 4) + 1}`;
      const hrId = hrIds[hrKey];
      const studentId = studentIds[i];

      await ctx.db.insert("homeroomStudents", {
        homeroomId: hrId,
        studentId,
        enrolledAt: Date.now(),
        status: "active",
      });
      await ctx.db.patch(studentId, { currentHomeroomId: hrId });
    }

    // 3. Create Schedule (Friday focus)
    const dayOfWeek = 5; // Friday
    
    // Create robust schedule for Sarah Williams (Sarah) and David Miller
    // Slot 1: Demo Session (Morning/Ongoing) - Sarah Williams
    // We'll set this from 08:00 to 20:00 to ensure it's visible regardless of drift during demo
    await ctx.db.insert("scheduleSlots", {
      homeroomId: hrIds.hr104, // CS Alpha
      subjectId: subjectIds.math,
      teacherId: teacherIds[0], // Sarah Williams
      dayOfWeek,
      startTime: "08:00",
      endTime: "21:00",
    });

    // Slot 2: Additional sessions for variety
    await ctx.db.insert("scheduleSlots", {
      homeroomId: hrIds.hr101,
      subjectId: subjectIds.cs,
      teacherId: teacherIds[1], // David Miller
      dayOfWeek,
      startTime: "09:00",
      endTime: "12:00",
    });

    // 4. Generate 7-Day History of Logs
    const historyNow = Date.now();
    for (let day = 1; day <= 7; day++) {
      const timestamp = historyNow - (day * 24 * 3600000);
      for (let j = 0; j < 20; j++) {
        const student = await ctx.db.get(studentIds[Math.floor(Math.random() * studentIds.length)]);
        if (!student) continue;
        
        await ctx.db.insert("accessLogs", {
          userId: student._id,
          roomId: roomIds.lab305,
          method: "card",
          action: "OPEN_GATE",
          result: "granted",
          timestamp: timestamp + (Math.random() * 3600000),
          timestampType: "server",
        });
      }
    }

    // 5. Generate Today's Sessions (Generated based on schedule above)
    const today = new Date().toISOString().split('T')[0];
    const schoolDay = await ctx.db.query("schoolDays")
      .withIndex("by_date", q => q.eq("date", today))
      .unique();
    
    if (schoolDay) {
      const slots = await ctx.db.query("scheduleSlots").collect();
      for (const slot of slots) {
        const sessionId = await ctx.db.insert("dailySessions", {
          scheduleSlotId: slot._id,
          schoolDayId: schoolDay._id,
          date: today,
          status: "open",
          windowStart: Date.now() - (4 * 3600000), // 4 hours ago
          windowEnd: Date.now() + (8 * 3600000),  // 8 hours from now
        });

        // Pre-fill attendance as absent
        const enrollments = await ctx.db.query("homeroomStudents")
          .withIndex("by_homeroom", q => q.eq("homeroomId", slot.homeroomId))
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

    // 6. Pre-register Hardware Devices
    await ctx.db.insert("devices", {
      chipId: "DEVICE_NODE_A",
      name: "Gatekeeper (Door)",
      roomId: roomIds.lab305,
      status: "online",
      firmwareVersion: "1.0.0-solid",
      lastSeen: Date.now(),
    });
    await ctx.db.insert("devices", {
      chipId: "DEVICE_NODE_B",
      name: "Watchman (Ceiling)",
      roomId: roomIds.lab305,
      status: "online",
      firmwareVersion: "1.0.0-solid",
      lastSeen: Date.now(),
    });

    // 7. Add Mock Alerts for Sarah Williams (Teacher Demo)
    await ctx.db.insert("adminAlerts", {
      type: "SUSPECT_GPS",
      severity: "high",
      message: "Student Liam Smith attempted check-in from 1.2km away.",
      userId: teacherIds[0], // Sarah sees this
      roomId: roomIds.lab305,
      timestamp: Date.now() - 600000,
      status: "active",
    });
    await ctx.db.insert("adminAlerts", {
      type: "SUSPECT_DEVICE",
      severity: "medium",
      message: "Student Olivia Johnson using multiple devices for attendance.",
      userId: teacherIds[0],
      roomId: roomIds.lab305,
      timestamp: Date.now() - 1200000,
      status: "active",
    });
  }
});
