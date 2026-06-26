import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { auth } from "./auth";

// Get current logged-in user
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
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





