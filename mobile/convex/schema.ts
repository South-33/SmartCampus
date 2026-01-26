import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("student"),
        v.literal("teacher"),
        v.literal("admin"),
        v.literal("staff")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("enrolled"),
        v.literal("graduated"),
        v.literal("expelled"),
        v.literal("active"),
        v.literal("inactive"),
        v.literal("temporary")
      )
    ),
    cardUID: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    allowedRooms: v.optional(v.array(v.string())),
  }).index("by_email", ["email"]),
  rooms: defineTable({
    name: v.string(),
    nodeId: v.optional(v.string()),
    gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    lockStatus: v.optional(v.union(v.literal("unlocked"), v.literal("locked"), v.literal("staff_only"))),
    powerStatus: v.optional(v.union(v.literal("on"), v.literal("off"))),
    occupancy: v.optional(v.number()),
  }),
  devices: defineTable({
    chipId: v.string(),
    roomId: v.optional(v.id("rooms")),
    name: v.string(),
    firmwareVersion: v.optional(v.string()),
    lastSeen: v.optional(v.number()),
    status: v.string(),
  }).index("by_chipId", ["chipId"]),
  accessLogs: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
    method: v.union(v.literal("card"), v.literal("phone")),
    action: v.union(v.literal("OPEN_GATE"), v.literal("ATTENDANCE")),
    result: v.string(),
    timestamp: v.number(),
    timestampType: v.union(v.literal("server"), v.literal("local")),
    gps: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  }).index("by_user", ["userId"]),
});
