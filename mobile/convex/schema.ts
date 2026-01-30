import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  
  // ============ USERS & AUTH ============
  
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    
    // School Specific Fields
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
    cardUID: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    
    // Cache current homeroom for performance
    currentHomeroomId: v.optional(v.id("homerooms")),
    
    // Academic Info
    major: v.optional(v.string()),
    year: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_cardUID", ["cardUID"])
    .index("by_role", ["role"])
    .index("by_homeroom", ["currentHomeroomId"]),

  // ============ ACADEMIC STRUCTURE ============

  semesters: defineTable({
    name: v.string(),                    // "Fall 2026"
    startDate: v.string(),               // "2026-08-15"
    endDate: v.string(),                 // "2026-12-20"
    status: v.union(v.literal("active"), v.literal("upcoming"), v.literal("archived")),
  })
    .index("by_status", ["status"]),

  schoolDays: defineTable({
    semesterId: v.id("semesters"),
    date: v.string(),                    // "2026-08-15"
    dayType: v.union(
      v.literal("regular"),
      v.literal("exam"), 
      v.literal("half_day"),
      v.literal("holiday")
    ),
    holidayName: v.optional(v.string()), // "Pchum Ben"
  })
    .index("by_semester", ["semesterId"])
    .index("by_date", ["date"]),

  // ============ ROOMS & HOMEROOMS ============

  rooms: defineTable({
    name: v.string(),
    type: v.optional(v.union(v.literal("academic"), v.literal("hub"), v.literal("restricted"), v.literal("bathroom"))),
    nodeId: v.optional(v.string()),
    gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    lockStatus: v.optional(v.union(v.literal("unlocked"), v.literal("locked"), v.literal("staff_only"))),
    powerStatus: v.optional(v.union(v.literal("on"), v.literal("off"))),
    occupancy: v.optional(v.number()),
    needsCleaning: v.optional(v.boolean()),
    lastCleanedAt: v.optional(v.string()),
    lastUpdated: v.optional(v.number()),
  }),

  homerooms: defineTable({
    roomId: v.id("rooms"),
    semesterId: v.id("semesters"),
    name: v.string(),                    // "Grade 10A"
    gradeLevel: v.optional(v.string()),  // "10"
    section: v.optional(v.string()),     // "A"
  })
    .index("by_semester", ["semesterId"])
    .index("by_room", ["roomId"]),

  homeroomStudents: defineTable({
    homeroomId: v.id("homerooms"),
    studentId: v.id("users"),
    enrolledAt: v.number(),
    status: v.union(v.literal("active"), v.literal("transferred"), v.literal("dropped")),
  })
    .index("by_homeroom", ["homeroomId"])
    .index("by_student", ["studentId"])
    .index("by_homeroom_student", ["homeroomId", "studentId"]),

  // ============ SUBJECTS & SCHEDULE ============

  subjects: defineTable({
    name: v.string(),                    // "Mathematics"
    code: v.optional(v.string()),        // "MATH101"
  }),

  scheduleSlots: defineTable({
    homeroomId: v.id("homerooms"),
    subjectId: v.id("subjects"),
    teacherId: v.id("users"),
    dayOfWeek: v.number(),               // 1=Mon, 2=Tue, ... 5=Fri
    startTime: v.string(),               // "09:00"
    endTime: v.string(),                 // "10:30"
  })
    .index("by_homeroom", ["homeroomId"])
    .index("by_teacher", ["teacherId"])
    .index("by_day", ["dayOfWeek"])
    .index("by_homeroom_day_time", ["homeroomId", "dayOfWeek", "startTime"])
    .index("by_teacher_day_time", ["teacherId", "dayOfWeek", "startTime"]),

  // ============ DAILY SESSIONS & ATTENDANCE ============

  dailySessions: defineTable({
    scheduleSlotId: v.id("scheduleSlots"),
    schoolDayId: v.id("schoolDays"),
    date: v.string(),                    // "2026-08-15"
    status: v.union(
      v.literal("upcoming"),
      v.literal("open"),                 // Attendance window active
      v.literal("closed"),
      v.literal("cancelled")
    ),
    windowStart: v.number(),             // Epoch timestamp
    windowEnd: v.number(),               // Epoch timestamp
    windowOverrideBy: v.optional(v.id("users")),
    windowOverrideReason: v.optional(v.string()),
  })
    .index("by_date", ["date"])
    .index("by_slot", ["scheduleSlotId"])
    .index("by_status", ["status"])
    .index("by_slot_date", ["scheduleSlotId", "date"]),

  attendance: defineTable({
    dailySessionId: v.id("dailySessions"),
    studentId: v.id("users"),
    status: v.union(
      v.literal("present"),
      v.literal("late"),
      v.literal("absent"),
      v.literal("excused")
    ),
    scanTime: v.optional(v.number()),
    method: v.optional(v.union(v.literal("card"), v.literal("phone"))),
    markedManually: v.boolean(),
    markedBy: v.optional(v.id("users")),
    note: v.optional(v.string()),
    
    // Anti-cheat payload
    deviceTime: v.optional(v.number()),
    timeSource: v.optional(v.string()),
    hasInternet: v.optional(v.boolean()),
    deviceId: v.optional(v.string()),
    gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    scanOrder: v.optional(v.number()),
  })
    .index("by_session", ["dailySessionId"])
    .index("by_student", ["studentId"])
    .index("by_session_student", ["dailySessionId", "studentId"]),

  // ============ HARDWARE & LOGS ============

  devices: defineTable({
    chipId: v.string(),
    tokenHash: v.optional(v.string()),
    roomId: v.optional(v.id("rooms")),
    name: v.string(),
    firmwareVersion: v.optional(v.string()),
    lastSeen: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("online"),
      v.literal("offline"),
      v.literal("disabled")
    ),
  })
    .index("by_chipId", ["chipId"])
    .index("by_lastSeen", ["lastSeen"])
    .index("by_status", ["status"]),

  accessLogs: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
    method: v.union(v.literal("card"), v.literal("phone")),
    action: v.union(v.literal("OPEN_GATE"), v.literal("ATTENDANCE")),
    result: v.string(),
    timestamp: v.number(),
    timestampType: v.union(v.literal("server"), v.literal("local")),
    deviceTime: v.optional(v.number()),
    timeSource: v.optional(v.string()),
    hasInternet: v.optional(v.boolean()),
    deviceId: v.optional(v.string()),
    gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    scanOrder: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_room_timestamp", ["roomId", "timestamp"]),

  staffTasks: defineTable({
    roomId: v.id("rooms"),
    type: v.union(v.literal("cleaning"), v.literal("maintenance"), v.literal("inspection")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed")),
    description: v.string(),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
  }).index("by_room", ["roomId"]),

  auditLogs: defineTable({
    actorId: v.id("users"),
    action: v.string(),
    description: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  // ============ SYSTEM ALERTS ============

  adminAlerts: defineTable({
    type: v.union(
      v.literal("DEVICE_OFFLINE"),
      v.literal("SUSPECT_GPS"),
      v.literal("SUSPECT_DEVICE"),
      v.literal("SENSOR_MALFUNCTION")
    ),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    message: v.string(),
    deviceId: v.optional(v.id("devices")),
    userId: v.optional(v.id("users")),
    roomId: v.optional(v.id("rooms")),
    timestamp: v.number(),
    status: v.union(v.literal("active"), v.literal("resolved")),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_type", ["type"])
    .index("by_user_status", ["userId", "status"]),

  rateLimits: defineTable({
    key: v.string(),        // e.g., "register:chipId:ABC123"
    attempts: v.number(),
    windowStart: v.number(),
  }).index("by_key", ["key"]),
});
