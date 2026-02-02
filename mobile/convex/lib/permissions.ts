import { QueryCtx, MutationCtx } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "../_generated/dataModel";

export type User = Doc<"users">;

/**
 * Gets the current authenticated user and their profile.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<User | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
}

/**
 * Marks a room as updated so hardware knows to re-sync.
 */
export async function touchRoom(ctx: MutationCtx, roomId: Id<"rooms">) {
  await ctx.db.patch(roomId, { lastUpdated: Date.now() });
}

/**
 * High-level role checks
 */
export const mustBeAdmin = (user: User | null) => {
  if (!user) {
    throw new Error("You must be logged in to perform this action.");
  }
  if (user.role !== "admin") {
    throw new Error("Only administrators can perform this action.");
  }
};

export const mustBeTeacherOrAdmin = (user: User | null) => {
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error("Only teachers or administrators can perform this action.");
  }
};

export const mustBeAuthenticated = (user: User | null) => {
  if (!user) {
    throw new Error("You must be logged in to perform this action.");
  }
};

/**
 * Specific Access Checks
 */
export async function canAccessRoom(ctx: QueryCtx | MutationCtx, user: User, roomId: Id<"rooms">) {
  // Admins and Teachers/Staff have universal access
  if (user.role === "admin" || user.role === "teacher" || user.role === "staff") {
    return true;
  }
  
  // Students only have access to rooms associated with their homeroom
  if (user.role === "student") {
    // 1. Get student's current homeroom assignment
    const enrollment = await ctx.db
      .query("homeroomStudents")
      .withIndex("by_student", (q) => q.eq("studentId", user._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!enrollment) return false;

    // 2. Get the homeroom document to find the physical roomId
    const homeroom = await ctx.db.get(enrollment.homeroomId);
    return homeroom?.roomId === roomId;
  }
  
  return false;
}

/**
 * Filtered Access Helpers
 */
export async function filterRoomsForUser(ctx: QueryCtx | MutationCtx, user: User, rooms: Doc<"rooms">[]) {
  if (user.role === "admin" || user.role === "teacher" || user.role === "staff") {
    return rooms;
  }
  
  const accessibleRooms: Doc<"rooms">[] = [];
  for (const room of rooms) {
    if (await canAccessRoom(ctx, user, room._id)) {
      accessibleRooms.push(room);
    }
  }
  return accessibleRooms;
}

/**
 * Audit Logging Helper
 */
export async function logActivity(
  ctx: MutationCtx,
  user: User,
  action: string,
  description: string
) {
  await ctx.db.insert("auditLogs", {
    actorId: user._id,
    action,
    description,
    timestamp: Date.now(),
  });
}
