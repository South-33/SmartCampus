import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id, TableNames } from "../_generated/dataModel";

/**
 * Helper to hash a token for secure storage/comparison
 */
export async function hashToken(token: string) {
  const msgUint8 = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Haversine formula to calculate distance between two GPS points in meters.
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
}

/**
 * Generates a secure random token
 */
export function generateSecureToken(length: number = 24): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Attendance window calculation (used in sessions.ts and crons.ts)
 */
export function calculateAttendanceWindow(startTimestamp: number, durationMs: number) {
  return {
    windowStart: startTimestamp - (15 * 60 * 1000), // 15 min before
    windowEnd: startTimestamp + (durationMs / 2),   // Half duration
  };
}

/**
 * Batch get documents by IDs
 */
export async function batchGet<T extends TableNames>(
  ctx: QueryCtx | MutationCtx,
  table: T,
  ids: Id<T>[]
) {
  const uniqueIds = [...new Set(ids.filter(id => id !== null && id !== undefined))];
  const docs = await Promise.all(uniqueIds.map(id => ctx.db.get(id)));
  const resultMap = new Map<Id<T>, Doc<T>>();
  for (const doc of docs) {
    if (doc) resultMap.set(doc._id, doc as any);
  }
  return resultMap;
}
