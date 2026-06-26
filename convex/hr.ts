import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { auth } from "./auth";

// Server-side authentication and authorization check
async function validateHRorAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (userId === null) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db.get(userId);
  if (!user || (user.role !== "admin" && user.role !== "hr")) {
    throw new Error("Forbidden: HR or Admin access only");
  }
  return user;
}

// Strictly Admin-only check
async function validateAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (userId === null) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") {
    throw new Error("Forbidden: Admin access only");
  }
  return user;
}

// ── KPI ANALYTICS ────────────────────────────────────────────────────
export const getHRDashboardAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const employees = await ctx.db.query("employees").collect();
    const leaves = await ctx.db.query("leaves").collect();
    const holidays = await ctx.db.query("holidays").collect();

    const todayStr = new Date().toISOString().split("T")[0];
    const attendanceToday = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", todayStr))
      .collect();

    // 1. Total Employees
    const totalEmployees = users.length;

    // 2. Present Today
    const presentToday = attendanceToday.filter((a) => a.status === "present" || a.status === "late").length;

    // 3. Late Check-ins
    const lateToday = attendanceToday.filter((a) => a.status === "late").length;

    // 4. Absent Today (Employees - Present)
    const activeEmployeesCount = employees.filter((e) => e.status === "Active").length;
    const absentToday = Math.max(0, activeEmployeesCount - presentToday);

    // 5. Pending Leaves
    const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;

    // 6. New Joiners (Joining date in the last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const newJoiners = employees.filter((e) => {
      try {
        const joinDate = new Date(e.joiningDate).getTime();
        return joinDate >= thirtyDaysAgo;
      } catch {
        return false;
      }
    }).length;

    // 7. Birthdays (Current Month)
    const currentMonth = new Date().getMonth(); // 0-11
    const birthdaysThisMonth = employees.filter((e) => {
      try {
        const dob = new Date(e.dateOfBirth);
        return dob.getMonth() === currentMonth;
      } catch {
        return false;
      }
    }).length;

    // 8. Probation Employees
    const nowTime = Date.now();
    const probationEmployees = employees.filter((e) => {
      if (!e.probationEndDate) return false;
      try {
        const probEnd = new Date(e.probationEndDate).getTime();
        return probEnd > nowTime;
      } catch {
        return false;
      }
    }).length;

    // 9. Upcoming Holidays
    const upcomingHolidays = holidays.filter((h) => {
      try {
        return new Date(h.date).getTime() >= nowTime - 24 * 60 * 60 * 1000;
      } catch {
        return false;
      }
    }).length;

    return {
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      pendingLeaves,
      newJoiners,
      birthdaysThisMonth,
      probationEmployees,
      upcomingHolidays,
    };
  },
});

// ── ATTENDANCE MANAGEMENT ────────────────────────────────────────────
export const getAttendanceRecords = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);

    const records = await ctx.db.query("attendance").collect();
    const users = await ctx.db.query("users").collect();
    const employees = await ctx.db.query("employees").collect();

    // Map user names, emails, employeeId, and designation to attendance records
    return records.map((r) => {
      const u = users.find((usr) => usr._id === r.userId);
      const e = employees.find((emp) => emp.userId === r.userId);
      return {
        ...r,
        employeeName: u?.name || "Unnamed Employee",
        employeeEmail: u?.email || "",
        employeeId: e?.employeeId || "",
        designation: e?.designation || "",
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  },
});

// ── UPDATE ATTENDANCE RECORD (Admin CRUD) ─────────────────────────────
export const updateAttendanceRecord = mutation({
  args: {
    attendanceId: v.id("attendance"),
    date: v.optional(v.string()),
    checkIn: v.optional(v.string()),
    checkOut: v.optional(v.string()),
    status: v.optional(v.string()),
    location: v.optional(v.string()),
    adminRemarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await validateAdmin(ctx);
    const record = await ctx.db.get(args.attendanceId);
    if (!record) throw new Error("Attendance record not found.");

    const { attendanceId, ...fields } = args;
    const patch: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) patch[key] = val;
    }
    patch.adminEditedAt = Date.now();
    patch.adminEditedBy = admin.name || "Admin";

    await ctx.db.patch(attendanceId, patch);

    await ctx.db.insert("logs", {
      userId: admin._id,
      action: "Attendance Record Updated",
      timestamp: Date.now(),
      details: `${admin.name} edited attendance for date ${record.date}. Remarks: ${args.adminRemarks || "N/A"}.`,
    });

    return { message: "Attendance record updated successfully." };
  },
});

// ── DELETE ATTENDANCE RECORD (Admin CRUD) ─────────────────────────────
export const deleteAttendanceRecord = mutation({
  args: {
    attendanceId: v.id("attendance"),
  },
  handler: async (ctx, args) => {
    const admin = await validateAdmin(ctx);
    const record = await ctx.db.get(args.attendanceId);
    if (!record) throw new Error("Attendance record not found.");

    await ctx.db.delete(args.attendanceId);

    await ctx.db.insert("logs", {
      userId: admin._id,
      action: "Attendance Record Deleted",
      timestamp: Date.now(),
      details: `${admin.name} deleted attendance record for userId ${record.userId} on ${record.date}.`,
    });

    return { message: "Attendance record deleted." };
  },
});

// ── ADD ATTENDANCE RECORD (Admin CRUD) ────────────────────────────────
export const addAttendanceRecord = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    checkIn: v.string(),
    checkOut: v.optional(v.string()),
    status: v.string(),
    location: v.optional(v.string()),
    adminRemarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await validateAdmin(ctx);

    // Guard against duplicate on same date
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("date"), args.date))
      .first();

    if (existing) throw new Error("An attendance record already exists for this employee on this date.");

    await ctx.db.insert("attendance", {
      userId: args.userId,
      date: args.date,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      status: args.status,
      location: args.location,
      adminRemarks: args.adminRemarks,
      adminEditedAt: Date.now(),
      adminEditedBy: admin.name || "Admin",
    });

    await ctx.db.insert("logs", {
      userId: admin._id,
      action: "Attendance Record Added",
      timestamp: Date.now(),
      details: `${admin.name} manually added attendance for userId ${args.userId} on ${args.date}.`,
    });

    return { message: "Attendance record created successfully." };
  },
});

// ── LEAVE MANAGEMENT ─────────────────────────────────────────────────
export const getLeaveRequests = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);

    const requests = await ctx.db.query("leaves").collect();
    const users = await ctx.db.query("users").collect();
    const employees = await ctx.db.query("employees").collect();

    return requests.map((r) => {
      const u = users.find((usr) => usr._id === r.userId);
      const e = employees.find((emp) => emp.userId === r.userId);
      return {
        ...r,
        employeeName: u?.name || "Unnamed Employee",
        employeeEmail: u?.email || "",
        designation: e?.designation || "Staff",
        employeeId: e?.employeeId || "",
      };
    }).sort((a, b) => b.appliedOn - a.appliedOn);
  },
});

export const updateLeaveStatus = mutation({
  args: {
    leaveId: v.id("leaves"),
    status: v.string(), // "Approved" | "Rejected"
  },
  handler: async (ctx, args) => {
    const caller = await validateHRorAdmin(ctx);

    const leave = await ctx.db.get(args.leaveId);
    if (!leave) throw new Error("Leave request not found");

    await ctx.db.patch(args.leaveId, {
      status: args.status,
    });

    const targetUser = await ctx.db.get(leave.userId as Id<"users">);

    // Add Audit Log
    await ctx.db.insert("logs", {
      userId: caller._id,
      action: `Leave request ${args.status}`,
      timestamp: Date.now(),
      details: `${caller.name} updated leave request status for ${targetUser?.name || "Unknown"} to ${args.status}.`,
    });

    // Send Notification to Employee
    await ctx.db.insert("notifications", {
      userId: leave.userId,
      title: `Leave Request ${args.status}`,
      content: `Your request for ${leave.type} leave (${leave.startDate} to ${leave.endDate}) has been ${args.status.toLowerCase()}.`,
      read: false,
      timestamp: Date.now(),
    });

    return { message: `Leave request has been ${args.status.toLowerCase()} successfully.` };
  },
});

// ── HOLIDAYS ─────────────────────────────────────────────────────────
export const getHolidays = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);
    return await ctx.db.query("holidays").collect();
  },
});

export const addHoliday = mutation({
  args: {
    name: v.string(),
    date: v.string(), // YYYY-MM-DD
    type: v.string(), // "National" | "Regional" | "Corporate"
  },
  handler: async (ctx, args) => {
    const caller = await validateHRorAdmin(ctx);

    const holidayId = await ctx.db.insert("holidays", {
      name: args.name,
      date: args.date,
      type: args.type,
    });

    await ctx.db.insert("logs", {
      userId: caller._id,
      action: "Holiday Added",
      timestamp: Date.now(),
      details: `${caller.name} created a new ${args.type} holiday: ${args.name} on ${args.date}.`,
    });

    return { holidayId, message: "Holiday added successfully." };
  },
});

// ── ANNOUNCEMENTS (NOTICES) ──────────────────────────────────────────
export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);
    return await ctx.db.query("notices").order("desc").collect();
  },
});

export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    targetRoles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const caller = await validateHRorAdmin(ctx);

    const noticeId = await ctx.db.insert("notices", {
      title: args.title,
      content: args.content,
      publishedAt: Date.now(),
      targetRoles: args.targetRoles,
    });

    await ctx.db.insert("logs", {
      userId: caller._id,
      action: "Announcement Published",
      timestamp: Date.now(),
      details: `${caller.name} published notice: "${args.title}"`,
    });

    // Notify all active users matching the target role (mock notification triggers)
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (!args.targetRoles || args.targetRoles.includes(user.role || "")) {
        await ctx.db.insert("notifications", {
          userId: user._id,
          title: `Announcement: ${args.title}`,
          content: args.content.slice(0, 100) + (args.content.length > 100 ? "..." : ""),
          read: false,
          timestamp: Date.now(),
        });
      }
    }

    return { noticeId, message: "Announcement published successfully." };
  },
});

// ── DOCUMENTS ────────────────────────────────────────────────────────
export const getEmployeeDocuments = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);

    const docs = await ctx.db.query("documents").collect();
    const users = await ctx.db.query("users").collect();
    const employees = await ctx.db.query("employees").collect();

    return docs.map((d) => {
      const u = users.find((usr) => usr._id === d.userId);
      const e = employees.find((emp) => emp.userId === d.userId);
      return {
        ...d,
        employeeName: u?.name || "Unnamed Employee",
        employeeId: e?.employeeId || "",
      };
    }).sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

export const uploadDocument = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    fileUrl: v.string(),
    type: v.string(), // "Contract" | "ID Card" | "Certification" | "Other"
  },
  handler: async (ctx, args) => {
    const caller = await validateHRorAdmin(ctx);

    const docId = await ctx.db.insert("documents", {
      userId: args.userId,
      name: args.name,
      fileUrl: args.fileUrl,
      uploadedAt: Date.now(),
      type: args.type,
    });

    const targetUser = await ctx.db.get(args.userId as Id<"users">);

    await ctx.db.insert("logs", {
      userId: caller._id,
      action: "Document Uploaded",
      timestamp: Date.now(),
      details: `${caller.name} uploaded ${args.type} document (${args.name}) for ${targetUser?.name || "Unknown"}.`,
    });

    return { docId, message: "Document record added successfully." };
  },
});

// ── AUDIT LOGS ───────────────────────────────────────────────────────
export const getHRActivityLogs = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);
    const logs = await ctx.db.query("logs").order("desc").collect();
    const users = await ctx.db.query("users").collect();

    return logs.map((l) => {
      const u = l.userId ? users.find((usr) => usr._id === l.userId) : null;
      return {
        ...l,
        operatorName: u?.name || "System Process",
        operatorRole: u?.role || "System",
      };
    });
  },
});

// ── DEPARTMENTS (View only for HR, CRUD for Admin) ─────────────────────
export const getDepartments = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);
    return await ctx.db.query("departments").collect();
  },
});

export const createDepartment = mutation({
  args: {
    name: v.string(),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    // ADMIN ONLY operation
    const caller = await validateAdmin(ctx);

    const existing = await ctx.db
      .query("departments")
      .filter((q) => q.or(q.eq(q.field("name"), args.name), q.eq(q.field("code"), args.code)))
      .first();

    if (existing) {
      throw new Error(`Department with name or code already exists.`);
    }

    const deptId = await ctx.db.insert("departments", {
      name: args.name,
      code: args.code,
      employeeCount: 0,
    });

    await ctx.db.insert("logs", {
      userId: caller._id,
      action: "Department Created",
      timestamp: Date.now(),
      details: `${caller.name} created department: ${args.name} (${args.code}).`,
    });

    return { deptId, message: "Department created successfully." };
  },
});

// ── RECRUITMENT PIPELINE & CHECKLISTS (ONBOARDING) ───────────────────
export const getRecruitmentPipeline = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);
    const candidates = await ctx.db.query("candidates").collect();
    return candidates.map((c) => ({
      id: c._id,
      name: c.name,
      role: c.role,
      email: c.email,
      stage: c.stage,
      score: c.score,
      phone: c.phone,
    }));
  },
});

export const createCandidate = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    email: v.string(),
    phone: v.string(),
    stage: v.string(),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    await validateHRorAdmin(ctx);
    const candidateId = await ctx.db.insert("candidates", {
      name: args.name,
      role: args.role,
      email: args.email,
      phone: args.phone,
      stage: args.stage,
      score: args.score,
    });
    return { candidateId, message: "Candidate created successfully." };
  },
});

export const updateCandidateStage = mutation({
  args: {
    id: v.id("candidates"),
    stage: v.string(),
  },
  handler: async (ctx, args) => {
    await validateHRorAdmin(ctx);
    await ctx.db.patch(args.id, {
      stage: args.stage,
    });
    return { message: "Candidate stage updated successfully." };
  },
});

export const getOnboardingChecklist = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);

    const employees = await ctx.db.query("employees").collect();
    const users = await ctx.db.query("users").collect();

    // Map checklist status for employees onboarded recently (e.g. joined in last 60 days)
    const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
    const newHires = employees.filter((e) => {
      try {
        return new Date(e.joiningDate).getTime() >= cutoff;
      } catch {
        return false;
      }
    });

    return newHires.map((e) => {
      const u = users.find((usr) => usr._id === e.userId);
      // Mock onboarding steps percentage based on employee status
      const scoreBase = (e.employeeId.charCodeAt(e.employeeId.length - 1) || 0) % 4;
      const progress = scoreBase === 0 ? 100 : scoreBase === 1 ? 75 : scoreBase === 2 ? 50 : 25;
      return {
        id: e._id,
        employeeId: e.employeeId,
        name: u?.name || "New Recruit",
        email: u?.email || "",
        designation: e.designation,
        joiningDate: e.joiningDate,
        progress,
        tasks: [
          { name: "Contract Signed", done: true },
          { name: "ID Collected", done: progress >= 50 },
          { name: "IT Assets Allocated", done: progress >= 75 },
          { name: "HR Orientation Complete", done: progress === 100 },
        ],
      };
    });
  },
});

// ── CALENDAR ─────────────────────────────────────────────────────────
export const getCalendarEvents = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);

    const holidays = await ctx.db.query("holidays").collect();
    const leaves = await ctx.db.query("leaves").collect();
    const employees = await ctx.db.query("employees").collect();
    const users = await ctx.db.query("users").collect();

    const events: Array<{
      id: string;
      title: string;
      start: string;
      end?: string;
      type: "holiday" | "leave" | "birthday";
      color: string;
    }> = [];

    // 1. Add Holidays
    holidays.forEach((h) => {
      events.push({
        id: `h-${h._id}`,
        title: `Holiday: ${h.name}`,
        start: h.date,
        type: "holiday",
        color: "red",
      });
    });

    // 2. Add Approved Leaves
    leaves.filter((l) => l.status === "Approved").forEach((l) => {
      const u = users.find((usr) => usr._id === l.userId);
      events.push({
        id: `l-${l._id}`,
        title: `${u?.name || "Employee"} On Leave`,
        start: l.startDate,
        end: l.endDate,
        type: "leave",
        color: "amber",
      });
    });

    // 3. Add Employee Birthdays (Map to current year's date)
    const currentYear = new Date().getFullYear();
    employees.forEach((e) => {
      try {
        const u = users.find((usr) => usr._id === e.userId);
        if (!u) return;
        const dob = new Date(e.dateOfBirth);
        const bdayDate = `${currentYear}-${String(dob.getMonth() + 1).padStart(2, "0")}-${String(dob.getDate()).padStart(2, "0")}`;
        events.push({
          id: `b-${e._id}`,
          title: `Birthday: ${u.name}`,
          start: bdayDate,
          type: "birthday",
          color: "blue",
        });
      } catch {}
    });

    return events;
  },
});

// ── HR MOCK DATA SEEDER ──────────────────────────────────────────────
export const seedMockHRData = mutation({
  args: {},
  handler: async (ctx) => {
    const caller = await validateHRorAdmin(ctx);

    // 1. Seed Holidays
    const existingHolidays = await ctx.db.query("holidays").collect();
    if (existingHolidays.length === 0) {
      const currentYear = new Date().getFullYear();
      await ctx.db.insert("holidays", { name: "New Year's Day", date: `${currentYear}-01-01`, type: "National" });
      await ctx.db.insert("holidays", { name: "Independence Day", date: `${currentYear}-07-04`, type: "National" });
      await ctx.db.insert("holidays", { name: "Thanksgiving Holiday", date: `${currentYear}-11-26`, type: "National" });
      await ctx.db.insert("holidays", { name: "Christmas Eve", date: `${currentYear}-12-24`, type: "Corporate" });
      await ctx.db.insert("holidays", { name: "Christmas Day", date: `${currentYear}-12-25`, type: "National" });
    }

    // 2. Seed Leaves
    const existingLeaves = await ctx.db.query("leaves").collect();
    const users = await ctx.db.query("users").collect();
    const employeeUsers = users.filter((u) => u.role === "employee");

    if (existingLeaves.length === 0 && employeeUsers.length > 0) {
      const currentYear = new Date().getFullYear();
      // Generate some leaves
      for (let i = 0; i < Math.min(employeeUsers.length, 3); i++) {
        const u = employeeUsers[i];
        await ctx.db.insert("leaves", {
          userId: u._id,
          type: i === 0 ? "Sick" : i === 1 ? "Annual" : "Maternity",
          startDate: `${currentYear}-07-10`,
          endDate: `${currentYear}-07-15`,
          reason: "Family event / Personal health care coordination",
          status: i === 0 ? "Pending" : "Approved",
          appliedOn: Date.now() - 3600000 * 24 * i,
        });
      }
    }

    // 3. Seed Attendance records for today
    const todayStr = new Date().toISOString().split("T")[0];
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", todayStr))
      .collect();

    if (existingAttendance.length === 0 && employeeUsers.length > 0) {
      for (let i = 0; i < employeeUsers.length; i++) {
        const u = employeeUsers[i];
        await ctx.db.insert("attendance", {
          userId: u._id,
          date: todayStr,
          checkIn: i % 2 === 0 ? "09:05" : "09:25",
          checkOut: undefined,
          status: i % 2 === 0 ? "present" : "late",
          location: "HQ geofence (GPS Verified)",
        });
      }
    }

    // 4. Seed Announcements
    const existingNotices = await ctx.db.query("notices").collect();
    if (existingNotices.length === 0) {
      await ctx.db.insert("notices", {
        title: "Welcome to Nexora ERP!",
        content: "We have updated the portal with a unified SaaS human resources system. Employees can track checkins and request leaves directly from their sidebar portal.",
        publishedAt: Date.now() - 3600000 * 12,
      });
      await ctx.db.insert("notices", {
        title: "Health & Safety Guidelines Reminder",
        content: "HQ office geofencing restricts clockin access to verified 200m boundaries. Please coordinate with IT support if you experience coordinate lock errors.",
        publishedAt: Date.now() - 3600000 * 48,
        targetRoles: ["employee"],
      });
    }

    // Log the seeding
    await ctx.db.insert("logs", {
      userId: caller._id,
      action: "HR Database Seeded",
      timestamp: Date.now(),
      details: `${caller.name} seeded HR module mock records (Leaves, Holidays, Attendance, Announcements).`,
    });

    return { message: "Mock HR databases populated successfully!" };
  },
});
