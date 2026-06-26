import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { auth } from "./auth";

export function getDeactivationTime(adminReviewedAt: number, noticePeriod: string | undefined): number {
  if (!noticePeriod || noticePeriod.toLowerCase().includes("immediate")) {
    // 24 hours
    return adminReviewedAt + 24 * 60 * 60 * 1000;
  }
  const match = noticePeriod.match(/(\d+)\s*Day/i);
  if (match) {
    const days = parseInt(match[1], 10);
    return adminReviewedAt + days * 24 * 60 * 60 * 1000;
  }
  // Default to 24 hours if we cannot parse it
  return adminReviewedAt + 24 * 60 * 60 * 1000;
}

// Get current logged-in user
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    let isDeactivated = false;
    let deactivationTime: number | undefined = undefined;

    if (employee && employee.status === "Inactive") {
      isDeactivated = true;
    }

    // Always check approved resignation query for deactivation timestamp, even for HR/Admin users who do not have an employee profile record
    const resignation = await ctx.db
      .query("queries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "Resignation"),
          q.eq(q.field("status"), "Approved by Admin")
        )
      )
      .first();

    if (resignation && resignation.adminReviewedAt) {
      deactivationTime = getDeactivationTime(
        resignation.adminReviewedAt,
        resignation.noticePeriod
      );
      if (Date.now() >= deactivationTime) {
        isDeactivated = true;
      }
    }

    return {
      ...user,
      isDeactivated,
      deactivationTime,
    };
  },
});

export const deactivateSelf = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const employee = await ctx.db
      .query("employees")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .first();

    if (employee && employee.status === "Active") {
      const resignation = await ctx.db
        .query("queries")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("type"), "Resignation"),
            q.eq(q.field("status"), "Approved by Admin")
          )
        )
        .first();

      if (resignation && resignation.adminReviewedAt) {
        const deactivationTime = getDeactivationTime(
          resignation.adminReviewedAt,
          resignation.noticePeriod
        );
        if (Date.now() >= deactivationTime) {
          await ctx.db.patch(employee._id, { status: "Inactive" });
          
          // Log deactivation
          await ctx.db.insert("logs", {
            userId,
            action: "Account Deactivated",
            timestamp: Date.now(),
            details: `Employee account auto-deactivated after notice period completion.`,
          });
        }
      }
    }
  },
});

// List users (Only Admin and HR can access this)
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized");
    }
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "hr")) {
      throw new Error("Forbidden"); // Enforce RBAC
    }
    return await ctx.db.query("users").collect();
  },
});

// Mutation to seed mock users with preset roles for testing purposes
export const seedMockUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) {
      return { message: "Database already seeded" };
    }

    // Seed Departments
    const deptAdminId = await ctx.db.insert("departments", {
      name: "Administration",
      code: "ADM",
      employeeCount: 1,
    });
    
    const deptHrId = await ctx.db.insert("departments", {
      name: "Human Resources",
      code: "HR",
      employeeCount: 1,
    });

    const deptEngId = await ctx.db.insert("departments", {
      name: "Engineering",
      code: "ENG",
      employeeCount: 1,
    });

    // Seed mock users
    await ctx.db.insert("users", {
      name: "Jane Admin",
      email: "nktech@gmail.com",
      role: "admin",
      tokenIdentifier: "mock-admin-token",
      departmentId: deptAdminId,
    });

    await ctx.db.insert("users", {
      name: "John HR",
      email: "hr@erp.com",
      role: "hr",
      tokenIdentifier: "mock-hr-token",
      departmentId: deptHrId,
    });

    await ctx.db.insert("users", {
      name: "Jack Employee",
      email: "employee@erp.com",
      role: "employee",
      tokenIdentifier: "mock-employee-token",
      departmentId: deptEngId,
    });

    // Seed mock activity logs
    await ctx.db.insert("logs", {
      action: "System Seeded",
      timestamp: Date.now() - 3600000 * 2, // 2 hrs ago
      details: "Seeded Administration, HR, and Engineering departments.",
    });

    return { message: "Seeded 3 users (admin@erp.com, hr@erp.com, employee@erp.com) and 3 departments." };
  },
});

// Generate next employee ID sequentially (e.g. EMP-2026-0001)
export const generateNextEmployeeId = query({
  args: {},
  handler: async (ctx) => {
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-`;
    const allEmployees = await ctx.db.query("employees").collect();

    let maxNum = 0;
    for (const emp of allEmployees) {
      if (emp.employeeId && emp.employeeId.startsWith(prefix)) {
        const numStr = emp.employeeId.slice(prefix.length);
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
    const nextNumStr = String(maxNum + 1).padStart(4, "0");
    return `${prefix}${nextNumStr}`;
  },
});

// List all potential reporting managers
export const listManagers = query({
  args: {},
  handler: async (ctx) => {
    const callerId = await auth.getUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");
    const caller = await ctx.db.get(callerId);
    if (!caller || (caller.role !== "admin" && caller.role !== "hr")) {
      throw new Error("Forbidden: only admin or HR can access this information");
    }

    const allEmployees = await ctx.db.query("employees").collect();
    const result = [];
    for (const emp of allEmployees) {
      const user = await ctx.db.get(emp.userId as Id<"users">);
      if (user) {
        result.push({
          id: emp._id,
          employeeId: emp.employeeId,
          name: user.name ?? "Unnamed Employee",
          designation: emp.designation,
        });
      }
    }
    return result;
  },
});

// Create a new employee record (Admin only)
export const createEmployee = mutation({
  args: {
    // Auth fields
    name: v.string(),
    email: v.string(),
    role: v.string(),
    phone: v.optional(v.string()),
    password: v.string(),

    // Employee profile fields
    employeeId: v.string(),
    profilePhoto: v.optional(v.string()),
    personalEmail: v.string(),
    gender: v.string(),
    dateOfBirth: v.string(),
    address: v.string(),
    emergencyContact: v.string(),
    department: v.optional(v.string()),
    designation: v.string(),
    reportingManagerId: v.optional(v.string()),
    employmentType: v.string(),
    joiningDate: v.string(),
    probationEndDate: v.optional(v.string()),
    officeLocation: v.string(),
    officeId: v.optional(v.string()),
    shift: v.string(),
    salary: v.optional(v.number()), // Admin only
    username: v.string(),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // ── Auth guard: ONLY Admin can create new user accounts ─────────
    const callerId = await auth.getUserId(ctx);
    if (!callerId) throw new Error("Unauthorized");
    const caller = await ctx.db.get(callerId);
    if (!caller || caller.role !== "admin") {
      throw new Error("Forbidden: Only administrators can create new accounts");
    }

    // ── Salary guard: HR cannot write/provide salary ────────────────
    if (caller.role !== "admin" && args.salary !== undefined) {
      throw new Error("Forbidden: Only administrators can access/set employee salary");
    }

    // ── Duplicate email check ────────────────────────────────────────
    const existingEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (existingEmail) {
      throw new Error(`An account with the official email ${args.email} already exists`);
    }

    // ── Duplicate employeeId check ───────────────────────────────────
    const existingEmpId = await ctx.db
      .query("employees")
      .withIndex("employeeId", (q) => q.eq("employeeId", args.employeeId))
      .first();
    if (existingEmpId) {
      throw new Error(`Employee ID ${args.employeeId} is already assigned to another employee`);
    }

    // ── Duplicate username check ─────────────────────────────────────
    const existingUsername = await ctx.db
      .query("employees")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    if (existingUsername) {
      throw new Error(`Username @${args.username} is already taken`);
    }

    // ── Resolve departmentId by name or code (case-insensitive) ──────
    let departmentId: Id<"departments"> | undefined;
    if (args.department) {
      const allDepts = await ctx.db.query("departments").collect();
      const matched = allDepts.find(
        (d) => d.name.toLowerCase() === args.department!.toLowerCase() ||
               d.code.toLowerCase() === args.department!.toLowerCase()
      );
      if (matched) {
        departmentId = matched._id;
        // Increment employee count
        await ctx.db.patch(matched._id, {
          employeeCount: matched.employeeCount + 1,
        });
      }
    }

    // ── Hash the password using SHA-256 (Web Crypto API) ────────────
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(args.password));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // ── Single transaction creation: Insert user record ─────────────
    const newUserId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: args.role,
      phone: args.phone,
      departmentId: departmentId,
      passwordHash,
      tokenIdentifier: `manual-${args.email}-${Date.now()}`,
    });

    // ── Link user to an authentication account for Convex Auth ──────
    await ctx.db.insert("authAccounts", {
      userId: newUserId,
      provider: "password",
      providerAccountId: args.email,
      secret: passwordHash,
    });

    // ── Insert employee profile record ──────────────────────────────
    const newEmployeeId = await ctx.db.insert("employees", {
      userId: newUserId,
      employeeId: args.employeeId,
      profilePhoto: args.profilePhoto,
      personalEmail: args.personalEmail,
      gender: args.gender,
      dateOfBirth: args.dateOfBirth,
      address: args.address,
      emergencyContact: args.emergencyContact,
      designation: args.designation,
      reportingManagerId: args.reportingManagerId,
      employmentType: args.employmentType,
      joiningDate: args.joiningDate,
      probationEndDate: args.probationEndDate,
      officeLocation: args.officeLocation,
      officeId: args.officeId,
      shift: args.shift,
      salary: args.salary, // Saved only if creator is Admin
      username: args.username,
      status: args.status,
      notes: args.notes,
    });

    // ── Audit log ────────────────────────────────────────────────────
    await ctx.db.insert("logs", {
      userId: callerId,
      action: "New Employee Onboarded",
      timestamp: Date.now(),
      details: `Admin created authentication account and employee profile for ${args.name} (${args.employeeId}) in department ${args.department ?? "No Department"}.`,
    });

    return {
      userId: newUserId,
      employeeId: newEmployeeId,
      message: `Employee ${args.name} was onboarded successfully with ID ${args.employeeId}.`,
    };
  },
});

// Repair mutation to retroactively create authAccounts for users created without one
export const repairAuthAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    let createdCount = 0;

    for (const user of allUsers) {
      if (!user.email || !user.passwordHash) continue;

      // Check if they already have a password authAccount
      const existingAccount = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", user._id).eq("provider", "password")
        )
        .first();

      if (!existingAccount) {
        await ctx.db.insert("authAccounts", {
          userId: user._id,
          provider: "password",
          providerAccountId: user.email,
          secret: user.passwordHash,
        });
        createdCount++;
      }
    }

    return {
      message: `Successfully linked ${createdCount} existing user accounts to Convex Auth.`,
    };
  },
});

export const fixAdminPassword = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Find user
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", "nktech@gmail.com"))
      .first();

    if (!user) {
      throw new Error("Admin user nktech@gmail.com not found!");
    }

    // 2. Hash "123456"
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode("123456"));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // 3. Update user.passwordHash
    await ctx.db.patch(user._id, {
      passwordHash,
    });

    // 4. Find or create authAccounts record
    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", user._id).eq("provider", "password")
      )
      .first();

    if (existingAccount) {
      await ctx.db.patch(existingAccount._id, {
        secret: passwordHash,
        providerAccountId: "nktech@gmail.com",
      });
    } else {
      await ctx.db.insert("authAccounts", {
        userId: user._id,
        provider: "password",
        providerAccountId: "nktech@gmail.com",
        secret: passwordHash,
      });
    }

    return {
      message: "Successfully reset admin password for nktech@gmail.com to 123456",
      hash: passwordHash,
    };
  },
});

// ── NOTIFICATIONS AND RESIGNATION ────────────────────────────────────
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();
    for (const notif of unread) {
      await ctx.db.patch(notif._id, { read: true });
    }
  },
});

export const submitResignation = mutation({
  args: {
    position: v.string(),
    resignationDate: v.string(), // YYYY-MM-DD
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) throw new Error("User record not found");

    // Fetch all admins
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    // Fetch all HRs
    const hrs = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "hr"))
      .collect();

    const dateStr = args.resignationDate;

    // Admin receives all notifications. HR receives employee notifications only.
    const targets = currentUser.role === "hr" ? admins : [...admins, ...hrs];

    for (const target of targets) {
      await ctx.db.insert("notifications", {
        userId: target._id,
        title: `Resignation Submitted - ${currentUser.name}`,
        content: `${currentUser.name} (${args.position}) has submitted resignation effective ${dateStr}. Reason: ${args.reason}`,
        read: false,
        timestamp: Date.now(),
      });
    }

    // Insert into queries table
    await ctx.db.insert("queries", {
      userId,
      name: currentUser.name || "Unknown",
      email: currentUser.email || "",
      type: "Resignation",
      subject: `Resignation Submission - ${args.position}`,
      description: args.reason,
      status: currentUser.role === "hr" ? "Pending Admin Review" : "Pending HR Review",
      createdAt: Date.now(),
      resignationDate: args.resignationDate,
      position: args.position,
    });

    // Add a system log
    await ctx.db.insert("logs", {
      userId,
      action: "Resignation Submitted",
      timestamp: Date.now(),
      details: `${currentUser.name} (${args.position}) submitted resignation effective ${dateStr}. Reason: ${args.reason}`,
    });

    return { message: "Resignation submitted successfully." };
  },
});

export const submitSupportQuery = mutation({
  args: {
    category: v.string(),
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) throw new Error("User record not found");

    // Insert into queries table
    await ctx.db.insert("queries", {
      userId,
      name: currentUser.name || "Unknown",
      email: currentUser.email || "",
      type: "Support",
      subject: `[${args.category}] ${args.subject}`,
      description: args.description,
      status: currentUser.role === "hr" ? "Pending Admin Review" : "Pending HR Review",
      createdAt: Date.now(),
    });

    // Notify admins & HRs
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    const hrs = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "hr"))
      .collect();

    const targets = currentUser.role === "hr" ? admins : [...admins, ...hrs];

    for (const target of targets) {
      await ctx.db.insert("notifications", {
        userId: target._id,
        title: `New Support Query - ${currentUser.name}`,
        content: `${currentUser.name} submitted support query: ${args.subject}`,
        read: false,
        timestamp: Date.now(),
      });
    }

    // Add system log
    await ctx.db.insert("logs", {
      userId,
      action: "Support Query Submitted",
      timestamp: Date.now(),
      details: `${currentUser.name} submitted support query: ${args.subject}`,
    });

    return { message: "Support ticket registered successfully." };
  },
});

export const listQueries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "hr")) {
      throw new Error("Unauthorized access to employee queries");
    }

    return await ctx.db.query("queries").order("desc").collect();
  },
});

export const hrReviewQuery = mutation({
  args: {
    queryId: v.id("queries"),
    action: v.string(), // "Approve" | "Reject" | "Proceed"
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "hr") {
      throw new Error("Unauthorized access");
    }

    let status = "";
    if (args.action === "Approve") status = "Approved by HR";
    else if (args.action === "Reject") status = "Rejected by HR";
    else if (args.action === "Proceed") status = "Pending Admin Review";

    await ctx.db.patch(args.queryId, {
      status,
      hrRemarks: args.remarks || undefined,
      hrReviewedAt: Date.now(),
      hrReviewedBy: currentUser.name || "HR",
    });

    // Notify employee of review update
    const targetQuery = await ctx.db.get(args.queryId);
    if (targetQuery) {
      await ctx.db.insert("notifications", {
        userId: targetQuery.userId,
        title: `Query Update - ${status}`,
        content: `Your query "${targetQuery.subject}" status is now "${status}".`,
        read: false,
        timestamp: Date.now(),
      });
    }

    // Add log
    await ctx.db.insert("logs", {
      userId,
      action: "Query Reviewed by HR",
      timestamp: Date.now(),
      details: `HR updated query status to ${status}. Remarks: ${args.remarks || "None"}`,
    });

    return { message: "Query updated successfully." };
  },
});

export const adminReviewQuery = mutation({
  args: {
    queryId: v.id("queries"),
    action: v.string(), // "Approve" | "Reject"
    remarks: v.string(), // Reason
    noticePeriod: v.optional(v.string()), // Optional notice period
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Unauthorized access");
    }

    let status = "";
    if (args.action === "Approve") status = "Approved by Admin";
    else if (args.action === "Reject") status = "Rejected by Admin";

    await ctx.db.patch(args.queryId, {
      status,
      adminRemarks: args.remarks,
      adminReviewedAt: Date.now(),
      adminReviewedBy: currentUser.name || "Admin",
      noticePeriod: args.noticePeriod || undefined,
    });

    // Notify employee of review update
    const targetQuery = await ctx.db.get(args.queryId);
    if (targetQuery) {
      const noticeText = args.noticePeriod ? ` Notice Period: ${args.noticePeriod}.` : "";
      await ctx.db.insert("notifications", {
        userId: targetQuery.userId,
        title: `Query Update - ${status}`,
        content: `Your query "${targetQuery.subject}" status is now "${status}". Reason: ${args.remarks}.${noticeText}`,
        read: false,
        timestamp: Date.now(),
      });
    }

    // Add log
    const logNoticeText = args.noticePeriod ? `, Notice Period: ${args.noticePeriod}` : "";
    await ctx.db.insert("logs", {
      userId,
      action: "Query Reviewed by Admin",
      timestamp: Date.now(),
      details: `Admin updated query status to ${status}. Reason: ${args.remarks}${logNoticeText}`,
    });

    return { message: "Query updated successfully." };
  },
});

export const listMyQueries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("queries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});










