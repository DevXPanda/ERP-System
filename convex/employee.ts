import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { auth } from "./auth";
import {
  daysInMonth,
  calcPerDaySalary,
  calcEarnedSalary,
  calcTodayEarnings,
  calcEstimatedMonthSalary,
} from "./salary";

// HQ coordinates: New York HQ (40.7128, -74.0060)
const OFFICE_LAT = 40.7128;
const OFFICE_LNG = -74.0060;
const RADIUS_LIMIT_METERS = 200;

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── GET DASHBOARD DATA ───────────────────────────────────────────────
export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    // Get user details
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "employee") return null;

    // Get employee profile
    const profile = await ctx.db
      .query("employees")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    const todayStr = new Date().toISOString().split("T")[0];

    // Get today's attendance status
    const todayAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("date"), todayStr))
      .first();

    // Get attendance logs (last 30 days) to show in charts
    const attendanceHistory = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get leaves balance
    const leaves = await ctx.db
      .query("leaves")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get upcoming holidays
    const holidays = await ctx.db.query("holidays").collect();

    // Get announcements
    const notices = await ctx.db.query("notices").collect();

    // Get tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let departmentName = "Unassigned";
    if (user.departmentId) {
      const dept = await ctx.db.get(user.departmentId as Id<"departments">);
      if (dept) {
        departmentName = dept.name;
      }
    }

    // ── Salary & Earnings Calculation ──────────────────────────────
    const salaryRecord = profile
      ? await ctx.db
          .query("salary")
          .withIndex("by_employee", (q) => q.eq("employeeId", profile._id))
          .first()
      : null;

    let earningsData = null;
    if (salaryRecord) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-12
      const dayOfMonth = now.getDate();
      const totalDays = daysInMonth(year, month);
      const perDaySal = calcPerDaySalary(salaryRecord.basicSalary, totalDays);

      const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
      const monthAttendance = attendanceHistory.filter((a) =>
        a.date.startsWith(monthPrefix)
      );

      let presentDays = 0;
      let halfDays = 0;
      let overtimeHours = 0;
      for (const rec of monthAttendance) {
        if (rec.status === "present" || rec.status === "late") presentDays++;
        else if (rec.status === "half-day") halfDays++;
        if (rec.checkIn && rec.checkOut) {
          const [inH, inM] = rec.checkIn.split(":").map(Number);
          const [outH, outM] = rec.checkOut.split(":").map(Number);
          const workedMinutes = outH * 60 + outM - (inH * 60 + inM);
          if (workedMinutes > 9 * 60)
            overtimeHours += (workedMinutes - 9 * 60) / 60;
        }
      }

      const paidLeaveDays = leaves
        .filter((l) => l.status === "Approved" && l.startDate.startsWith(monthPrefix))
        .reduce((acc, l) => {
          const start = new Date(l.startDate).getDate();
          const end = new Date(l.endDate).getDate();
          return acc + Math.max(1, end - start + 1);
        }, 0);

      const earnedSoFar = calcEarnedSalary(
        perDaySal,
        presentDays,
        paidLeaveDays,
        halfDays,
        Math.round(overtimeHours * 10) / 10,
        salaryRecord.overtimeRatePerHour ?? 0
      );

      earningsData = {
        perDaySalary: Math.round(perDaySal * 100) / 100,
        todayEarnings: calcTodayEarnings(perDaySal, todayAttendance?.status ?? null),
        currentMonthEarnings: earnedSoFar,
        estimatedMonthSalary: calcEstimatedMonthSalary(
          earnedSoFar,
          perDaySal,
          totalDays,
          dayOfMonth
        ),
        totalDaysInMonth: totalDays,
        presentDays,
        paidLeaveDays,
        dayOfMonth,
      };
    }

    return {
      user,
      profile,
      departmentName,
      todayAttendance,
      attendanceHistory: attendanceHistory.slice(-30),
      leaves,
      holidays: holidays.slice(0, 5),
      notices: notices.slice(0, 5),
      tasks: tasks.filter((t) => t.status !== "Completed"),
      earnings: earningsData,
    };
  },
});

// ── GET PROFILE ──────────────────────────────────────────────────────
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User record not found");

    const profile = await ctx.db
      .query("employees")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    // Resolve Manager info if defined
    let managerName = "No Reporting Manager";
    if (profile?.reportingManagerId) {
      const managerProfile = await ctx.db.get(profile.reportingManagerId as Id<"employees">);
      if (managerProfile) {
        const managerUser = await ctx.db.get(managerProfile.userId as Id<"users">);
        if (managerUser) {
          managerName = `${managerUser.name} (${managerProfile.designation})`;
        }
      }
    }

    let departmentName = "Unassigned";
    if (user.departmentId) {
      const dept = await ctx.db.get(user.departmentId as Id<"departments">);
      if (dept) {
        departmentName = dept.name;
      }
    }

    return {
      user,
      profile,
      managerName,
      departmentName,
    };
  },
});

// ── UPDATE PROFILE ───────────────────────────────────────────────────
export const updateMyProfile = mutation({
  args: {
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    profilePhoto: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User record not found");

    const profile = await ctx.db
      .query("employees")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Employee profile record not found");

    // 1. Update Core User Details
    const userUpdates: {
      phone?: string;
      image?: string;
      passwordHash?: string;
    } = {};
    if (args.phone !== undefined) userUpdates.phone = args.phone;
    if (args.profilePhoto !== undefined) userUpdates.image = args.profilePhoto;

    if (args.password) {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(args.password));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      userUpdates.passwordHash = passwordHash;

      // Update corresponding authAccounts record for login password synchronization
      const account = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", userId).eq("provider", "password")
        )
        .first();

      if (account) {
        await ctx.db.patch(account._id, { secret: passwordHash });
      } else if (user.email) {
        await ctx.db.insert("authAccounts", {
          userId,
          provider: "password",
          providerAccountId: user.email,
          secret: passwordHash,
        });
      }
    }

    if (Object.keys(userUpdates).length > 0) {
      await ctx.db.patch(userId, userUpdates);
    }

    // 2. Update Employee Profile Details
    const profileUpdates: {
      address?: string;
      emergencyContact?: string;
      profilePhoto?: string;
    } = {};
    if (args.address !== undefined) profileUpdates.address = args.address;
    if (args.emergencyContact !== undefined) profileUpdates.emergencyContact = args.emergencyContact;
    if (args.profilePhoto !== undefined) profileUpdates.profilePhoto = args.profilePhoto;

    if (Object.keys(profileUpdates).length > 0) {
      await ctx.db.patch(profile._id, profileUpdates);
    }

    // ── Audit Log ────────────────────────────────────────────────────
    await ctx.db.insert("logs", {
      userId,
      action: "Profile Updated by Employee",
      timestamp: Date.now(),
      details: `${user.name} updated personal contact settings.`,
    });

    return { message: "Profile updated successfully." };
  },
});

// ── GPS-BASED ATTENDANCE ─────────────────────────────────────────────
export const checkIn = mutation({
  args: {
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User record not found");

    // Calculate distance from NY HQ office geofence
    const distance = calculateDistanceMeters(args.lat, args.lng, OFFICE_LAT, OFFICE_LNG);
    if (distance > RADIUS_LIMIT_METERS) {
      throw new Error(`GPS Validation Failed: You are ${Math.round(distance)}m away. Must be within 200m of the office center.`);
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Check if already checked in today
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("date"), todayStr))
      .first();

    if (existing) {
      throw new Error("You have already checked in for today.");
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0].slice(0, 5); // HH:MM

    // Determine status (Late if check-in is after 09:15 AM)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15);
    const status = isLate ? "late" : "present";

    const attendanceId = await ctx.db.insert("attendance", {
      userId,
      date: todayStr,
      checkIn: timeStr,
      status,
      location: `HQ Sector (${Math.round(distance)}m offset)`,
    });

    // ── Audit Log ────────────────────────────────────────────────────
    await ctx.db.insert("logs", {
      userId,
      action: "GPS Check In",
      timestamp: Date.now(),
      details: `${user.name} checked in from verified coordinates (${args.lat}, ${args.lng}). Status: ${status}.`,
    });

    return { attendanceId, message: `Checked in successfully as ${status} at ${timeStr}.` };
  },
});

export const checkOut = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const todayStr = new Date().toISOString().split("T")[0];

    // Find today's check-in
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("date"), todayStr))
      .first();

    if (!existing) {
      throw new Error("No check-in record found for today.");
    }

    if (existing.checkOut) {
      throw new Error("You have already checked out for today.");
    }

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0].slice(0, 5); // HH:MM

    await ctx.db.patch(existing._id, {
      checkOut: timeStr,
    });

    // ── Audit Log ────────────────────────────────────────────────────
    await ctx.db.insert("logs", {
      userId,
      action: "GPS Check Out",
      timestamp: Date.now(),
      details: `Checked out at ${timeStr} today.`,
    });

    return { message: `Checked out successfully at ${timeStr}.` };
  },
});

// ── LEAVE MANAGEMENT ─────────────────────────────────────────────────
export const applyLeave = mutation({
  args: {
    type: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const leaveId = await ctx.db.insert("leaves", {
      userId,
      type: args.type,
      startDate: args.startDate,
      endDate: args.endDate,
      reason: args.reason,
      status: "Pending",
      appliedOn: Date.now(),
    });

    return { leaveId, message: "Leave application submitted successfully." };
  },
});

export const getLeaveHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("leaves")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// ── HOLIDAYS ─────────────────────────────────────────────────────────
export const getHolidays = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("holidays").collect();
  },
});

// ── DOCUMENTS ────────────────────────────────────────────────────────
export const getDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// ── PAYROLL ──────────────────────────────────────────────────────────
export const getPayrollRecords = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("payroll")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// ── TASKS ────────────────────────────────────────────────────────────
export const getTasks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const updateTaskStatus = mutation({
  args: {
    taskId: v.id("tasks"),
    status: v.string(), // "Pending" | "In-Progress" | "Completed"
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== userId) {
      throw new Error("Task not found or unauthorized.");
    }

    await ctx.db.patch(args.taskId, {
      status: args.status,
    });

    return { message: `Task marked as ${args.status}.` };
  },
});

// ── ANNOUNCEMENTS / NOTICES ──────────────────────────────────────────
export const getNotices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("notices").collect();
  },
});

// ── PERFORMANCE ──────────────────────────────────────────────────────
export const getPerformanceReviews = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("performance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

// ── MOCK DATA SEEDER FOR EMPLOYEE workspace ──────────────────────────
export const seedMockEmployeeData = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // 1. Seed Notices
    const notices = await ctx.db.query("notices").collect();
    if (notices.length === 0) {
      await ctx.db.insert("notices", {
        title: "Annual Strategy Meet 2026",
        content: "Our yearly Corporate Strategy Meet is scheduled for next Monday in the Grand Ballroom. Attendance is mandatory for all personnel.",
        publishedAt: Date.now() - 3600000 * 24, // 1 day ago
      });
      await ctx.db.insert("notices", {
        title: "Q3 Information Security Audit",
        content: "IT Security Audit team will scan workstation compliance next week. Ensure all official data is backed up.",
        publishedAt: Date.now() - 3600000 * 48, // 2 days ago
      });
    }

    // 2. Seed Holidays
    const holidays = await ctx.db.query("holidays").collect();
    if (holidays.length === 0) {
      await ctx.db.insert("holidays", { name: "Independence Day", date: "2026-07-04", type: "National" });
      await ctx.db.insert("holidays", { name: "Labor Day", date: "2026-09-07", type: "National" });
      await ctx.db.insert("holidays", { name: "Thanksgiving Day", date: "2026-11-26", type: "National" });
      await ctx.db.insert("holidays", { name: "Christmas Eve", date: "2026-12-24", type: "Corporate" });
    }

    // 3. Seed employee tasks if none exist
    const employeeTasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (employeeTasks.length === 0) {
      await ctx.db.insert("tasks", {
        userId,
        title: "Configure NextJS Geofence Tracker",
        description: "Implement Haversine radius validation inside Convex mutation action.",
        dueDate: "2026-06-30",
        priority: "High",
        status: "In-Progress",
      });
      await ctx.db.insert("tasks", {
        userId,
        title: "Verify Employee Profile Read-Only Constraints",
        description: "Verify inputs are disabled on frontend for department and salary fields.",
        dueDate: "2026-07-05",
        priority: "Medium",
        status: "Pending",
      });
    }

    // 4. Seed Payroll
    const payrolls = await ctx.db
      .query("payroll")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (payrolls.length === 0) {
      await ctx.db.insert("payroll", {
        userId,
        month: "May 2026",
        baseSalary: 6200,
        allowances: 450,
        deductions: 180,
        netSalary: 6470,
        status: "Paid",
        paymentDate: Date.now() - 3600000 * 240, // 10 days ago
      });
      await ctx.db.insert("payroll", {
        userId,
        month: "April 2026",
        baseSalary: 6200,
        allowances: 400,
        deductions: 180,
        netSalary: 6420,
        status: "Paid",
        paymentDate: Date.now() - 3600000 * 960, // 40 days ago
      });
    }

    // 5. Seed Documents
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (docs.length === 0) {
      await ctx.db.insert("documents", {
        userId,
        name: "Offer Letter - Signed.pdf",
        fileUrl: "#",
        uploadedAt: Date.now() - 3600000 * 2400,
        type: "Onboarding",
      });
      await ctx.db.insert("documents", {
        userId,
        name: "Confidentiality Agreement.pdf",
        fileUrl: "#",
        uploadedAt: Date.now() - 3600000 * 2300,
        type: "Compliance",
      });
    }

    // 6. Seed Leaves
    const leaves = await ctx.db
      .query("leaves")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (leaves.length === 0) {
      await ctx.db.insert("leaves", {
        userId,
        type: "Sick Leave",
        startDate: "2026-05-12",
        endDate: "2026-05-13",
        reason: "Flu and fever recommendation by physician",
        status: "Approved",
        appliedOn: Date.now() - 3600000 * 1000,
      });
    }

    // 7. Seed Performance
    const performance = await ctx.db
      .query("performance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    if (performance.length === 0) {
      await ctx.db.insert("performance", {
        userId,
        rating: 4.8,
        feedback: "Outstanding contributions to the Next.js ERP migration. Highly structured codebase integration.",
        reviewPeriod: "Q1 2026",
        reviewedBy: "Sarah Lead",
      });
    }

    return { message: "Mock employee workspace seeded successfully." };
  },
});
