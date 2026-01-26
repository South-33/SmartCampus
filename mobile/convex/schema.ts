import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    // School Specific Fields
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("admin"),
      v.literal("staff")
    ),
    status: v.union(
      v.literal("enrolled"),
      v.literal("graduated"),
      v.literal("expelled"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("temporary")
    ),
    cardUID: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    allowedRooms: v.optional(v.array(v.id("rooms"))),
  })
    .index("by_email", ["email"])
    .index("by_cardUID", ["cardUID"])
    .index("by_role", ["role"]),
  rooms: defineTable({
    name: v.string(),
    nodeId: v.optional(v.string()),
    gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    lockStatus: v.optional(v.union(v.literal("unlocked"), v.literal("locked"), v.literal("staff_only"))),
    powerStatus: v.optional(v.union(v.literal("on"), v.literal("off"))),
    occupancy: v.optional(v.number()),
    lastUpdated: v.optional(v.number()), // Track roster/config changes
  }),
  devices: defineTable({
    chipId: v.string(),
    tokenHash: v.optional(v.string()), // Hashed security token
    roomId: v.optional(v.id("rooms")),
    name: v.string(),
    firmwareVersion: v.optional(v.string()),
    lastSeen: v.optional(v.number()),
    status: v.string(),
  })
    .index("by_chipId", ["chipId"])
    .index("by_lastSeen", ["lastSeen"]),
  accessLogs: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
    method: v.union(v.literal("card"), v.literal("phone")),
    action: v.union(v.literal("OPEN_GATE"), v.literal("ATTENDANCE")),
    result: v.string(),
    timestamp: v.number(), // Server sync time
    timestampType: v.union(v.literal("server"), v.literal("local")),
    
    // Anti-Cheat Fields (from README)
    deviceTime: v.optional(v.number()),   // Time reported by phone
    timeSource: v.optional(v.string()),   // "ntp" or "local"
    hasInternet: v.optional(v.boolean()),
    deviceId: v.optional(v.string()),     // Phone's unique ID
    gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    scanOrder: v.optional(v.number()),
  }).index("by_user", ["userId"]),


  auditLogs: defineTable({
    actorId: v.id("users"),
    action: v.string(),
    description: v.string(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),
});
