import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, mustBeAdmin, touchRoom } from "./lib/permissions";

/**
 * Creates a new homeroom and links it to a physical room and semester.
 */
export const create = mutation({
  args: {
    roomId: v.id("rooms"),
    semesterId: v.id("semesters"),
    name: v.string(),
    gradeLevel: v.optional(v.string()),
    section: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    const homeroomId = await ctx.db.insert("homerooms", {
      roomId: args.roomId,
      semesterId: args.semesterId,
      name: args.name,
      gradeLevel: args.gradeLevel,
      section: args.section,
    });

    // Notify hardware to re-sync whitelist for this room
    await touchRoom(ctx, args.roomId);

    return homeroomId;
  },
});

/**
 * Enrolls a student in a homeroom.
 */
export const enrollStudent = mutation({
  args: {
    homeroomId: v.id("homerooms"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);

    // 1. Check if student is already enrolled in a homeroom for this semester
    const homeroom = await ctx.db.get(args.homeroomId);
    if (!homeroom) throw new Error("Homeroom not found");

    const existingEnrollment = await ctx.db
      .query("homeroomStudents")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
    
    // Check if any existing enrollment is in the same semester
    for (const enroll of existingEnrollment) {
      const hr = await ctx.db.get(enroll.homeroomId);
      if (hr?.semesterId === homeroom.semesterId) {
        // Deactivate old enrollment for this semester
        await ctx.db.patch(enroll._id, { status: "transferred" });
      }
    }

    // 2. Create new enrollment
    const enrollmentId = await ctx.db.insert("homeroomStudents", {
      homeroomId: args.homeroomId,
      studentId: args.studentId,
      enrolledAt: Date.now(),
      status: "active",
    });

    // 3. Update user cache
    await ctx.db.patch(args.studentId, {
      currentHomeroomId: args.homeroomId,
    });

    // 4. Notify hardware
    await touchRoom(ctx, homeroom.roomId);

    return enrollmentId;
  },
});

/**
 * Lists students in a homeroom.
 * Requires authentication - teachers can view homerooms they teach.
 */
export const getRoster = query({
  args: { homeroomId: v.id("homerooms") },
  handler: async (ctx, args) => {
    // Auth check
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Authentication required");
    }
    
    // Students cannot view full roster (privacy)
    if (user.role === "student") {
      throw new Error("Students cannot view homeroom rosters");
    }
    
    // Teachers, staff, and admins can view
    if (user.role !== "admin" && user.role !== "teacher" && user.role !== "staff") {
      throw new Error("Unauthorized");
    }

    const enrollments = await ctx.db
      .query("homeroomStudents")
      .withIndex("by_homeroom", (q) => q.eq("homeroomId", args.homeroomId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const students = [];
    for (const enroll of enrollments) {
      const student = await ctx.db.get(enroll.studentId);
      if (student) students.push(student);
    }

    return students;
  },
});

/**
 * Lists all homerooms for the active semester.
 */
export const list = query({
  args: { semesterId: v.id("semesters") },
  handler: async (ctx, args) => {
    const hrooms = await ctx.db
      .query("homerooms")
      .withIndex("by_semester", (q) => q.eq("semesterId", args.semesterId))
      .collect();

    const results = [];
    for (const hr of hrooms) {
      const room = await ctx.db.get(hr.roomId);
      results.push({
        ...hr,
        roomName: room?.name,
      });
    }
    return results;
  },
});

/**
 * Bulk enrolls multiple students in a homeroom.
 */
export const bulkEnrollStudents = mutation({
  args: {
    homeroomId: v.id("homerooms"),
    studentIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);
    
    const homeroom = await ctx.db.get(args.homeroomId);
    if (!homeroom) throw new Error("Homeroom not found");
    
    const results = { enrolled: 0, skipped: 0 };
    
    for (const studentId of args.studentIds) {
      // Check existing enrollment in this semester
      const existingEnrollment = await ctx.db
        .query("homeroomStudents")
        .withIndex("by_student", q => q.eq("studentId", studentId))
        .filter(q => q.eq(q.field("status"), "active"))
        .collect();
      
      let alreadyInSameHomeroom = false;
      for (const enroll of existingEnrollment) {
        const hr = await ctx.db.get(enroll.homeroomId);
        if (hr?.semesterId === homeroom.semesterId) {
          if (enroll.homeroomId === args.homeroomId) {
            alreadyInSameHomeroom = true;
          } else {
            await ctx.db.patch(enroll._id, { status: "transferred" });
          }
        }
      }
      
      if (alreadyInSameHomeroom) {
        results.skipped++;
        continue;
      }
      
      await ctx.db.insert("homeroomStudents", {
        homeroomId: args.homeroomId,
        studentId,
        enrolledAt: Date.now(),
        status: "active",
      });
      
      await ctx.db.patch(studentId, { currentHomeroomId: args.homeroomId });
      results.enrolled++;
    }
    
    await touchRoom(ctx, homeroom.roomId);
    return results;
  },
});

/**
 * Transfers a student from one homeroom to another.
 */
export const transferStudent = mutation({
  args: {
    studentId: v.id("users"),
    newHomeroomId: v.id("homerooms"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    mustBeAdmin(user);
    
    const newHomeroom = await ctx.db.get(args.newHomeroomId);
    if (!newHomeroom) throw new Error("New homeroom not found");
    
    // Find and deactivate current enrollment
    const currentEnrollment = await ctx.db
      .query("homeroomStudents")
      .withIndex("by_student", q => q.eq("studentId", args.studentId))
      .filter(q => q.eq(q.field("status"), "active"))
      .first();
    
    let oldRoomId = null;
    if (currentEnrollment) {
      const oldHomeroom = await ctx.db.get(currentEnrollment.homeroomId);
      oldRoomId = oldHomeroom?.roomId;
      await ctx.db.patch(currentEnrollment._id, { status: "transferred" });
    }
    
    // Create new enrollment
    await ctx.db.insert("homeroomStudents", {
      homeroomId: args.newHomeroomId,
      studentId: args.studentId,
      enrolledAt: Date.now(),
      status: "active",
    });
    
    await ctx.db.patch(args.studentId, { currentHomeroomId: args.newHomeroomId });
    
    // Touch both rooms for hardware sync
    if (oldRoomId) await touchRoom(ctx, oldRoomId);
    await touchRoom(ctx, newHomeroom.roomId);
    
    return { success: true };
  },
});

/**
 * Gets a student's current homeroom (for the active semester).
 */
export const getStudentHomeroom = query({
  args: {
    studentId: v.id("users"),
    semesterId: v.optional(v.id("semesters")),
  },
  handler: async (ctx, args) => {
    let targetSemester = args.semesterId;
    
    if (!targetSemester) {
      const active = await ctx.db
        .query("semesters")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .unique();
      targetSemester = active?._id;
    }
    
    if (!targetSemester) return null;
    
    const enrollment = await ctx.db
      .query("homeroomStudents")
      .withIndex("by_student", q => q.eq("studentId", args.studentId))
      .filter(q => q.eq(q.field("status"), "active"))
      .first();
    
    if (!enrollment) return null;
    
    const homeroom = await ctx.db.get(enrollment.homeroomId);
    if (!homeroom || homeroom.semesterId !== targetSemester) return null;
    
    const room = await ctx.db.get(homeroom.roomId);
    
    return {
      ...homeroom,
      roomName: room?.name,
      enrolledAt: enrollment.enrolledAt,
    };
  },
});
