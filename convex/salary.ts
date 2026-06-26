import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { auth } from "./auth";

// ── Auth helpers ──────────────────────────────────────────────────────

async function validateAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin")
    throw new Error("Forbidden: Admin access only");
  return { userId, user };
}

async function validateHRorAdmin(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user || (user.role !== "admin" && user.role !== "hr"))
    throw new Error("Forbidden: HR or Admin access only");
  return { userId, user };
}

// ── Salary calculation helpers ────────────────────────────────────────

/** Returns the number of days in a given month (month is 1-12), leap-year aware. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Per-day gross salary = basicSalary / daysInMonth */
export function calcPerDaySalary(basicSalary: number, totalDays: number): number {
  if (totalDays === 0) return 0;
  return basicSalary / totalDays;
}

/**
 * Earned gross salary for the month so far.
 * - presentDays: days with status "present" or "late"
 * - paidLeaveDays: approved leaves (count as full paid days)
 * - halfDays: count as 0.5 days worked
 * - overtimeHours: extra hours worked beyond 9-hour shift
 * - overtimeRatePerHour: hourly overtime rate
 */
export function calcEarnedSalary(
  perDaySalary: number,
  presentDays: number,
  paidLeaveDays: number,
  halfDays: number,
  overtimeHours: number,
  overtimeRatePerHour: number
): number {
  const workedValue = perDaySalary * (presentDays + paidLeaveDays + halfDays * 0.5);
  const overtimeValue = overtimeHours * overtimeRatePerHour;
  return Math.round((workedValue + overtimeValue) * 100) / 100;
}

/** Today's earnings based on today's attendance status */
export function calcTodayEarnings(
  perDaySalary: number,
  todayStatus: string | null
): number {
  if (!todayStatus) return 0;
  if (todayStatus === "present" || todayStatus === "late")
    return Math.round(perDaySalary * 100) / 100;
  if (todayStatus === "half-day")
    return Math.round(perDaySalary * 0.5 * 100) / 100;
  return 0; // absent
}

/**
 * Estimated month salary = earned so far + (remaining days * perDaySalary).
 * Uses actual calendar days in the month.
 */
export function calcEstimatedMonthSalary(
  earnedSoFar: number,
  perDaySalary: number,
  totalDaysInMonth: number,
  currentDayOfMonth: number
): number {
  const remainingDays = Math.max(0, totalDaysInMonth - currentDayOfMonth);
  return Math.round((earnedSoFar + remainingDays * perDaySalary) * 100) / 100;
}

// ── ADMIN: Set / update salary structure ─────────────────────────────

export const setSalaryStructure = mutation({
  args: {
    employeeId: v.string(),
    monthlyCTC: v.number(),
    basicSalary: v.number(),
    hra: v.optional(v.number()),
    allowances: v.optional(v.number()),
    perksAndBenefits: v.optional(v.number()),
    bonus: v.optional(v.number()),
    deductions: v.optional(v.number()),
    pf: v.optional(v.number()),
    esi: v.optional(v.number()),
    tds: v.optional(v.number()),
    overtimeRatePerHour: v.optional(v.number()),
    effectiveDate: v.optional(v.string()),
    salaryStatus: v.string(),
    paymentCycle: v.string(),
    revisionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId: adminId, user: admin } = await validateAdmin(ctx);

    const emp = await ctx.db.get(args.employeeId as Id<"employees">);
    if (!emp) throw new Error("Employee record not found.");

    const now = Date.now();
    const todayStr = new Date().toISOString().split("T")[0];

    const existing = await ctx.db
      .query("salary")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .first();

    if (existing) {
      const revisions = [...(existing.revisionHistory ?? [])];
      if (existing.monthlyCTC !== args.monthlyCTC) {
        revisions.push({
          date: todayStr,
          revisedBy: admin.name ?? "Admin",
          oldCTC: existing.monthlyCTC,
          newCTC: args.monthlyCTC,
          reason: args.revisionReason ?? "Manual revision by Admin",
        });
      }

      await ctx.db.patch(existing._id, {
        monthlyCTC: args.monthlyCTC,
        basicSalary: args.basicSalary,
        hra: args.hra,
        allowances: args.allowances,
        perksAndBenefits: args.perksAndBenefits,
        bonus: args.bonus,
        deductions: args.deductions,
        pf: args.pf,
        esi: args.esi,
        tds: args.tds,
        overtimeRatePerHour: args.overtimeRatePerHour,
        effectiveDate: args.effectiveDate,
        salaryStatus: args.salaryStatus,
        paymentCycle: args.paymentCycle,
        revisionHistory: revisions,
        updatedAt: now,
      });

      await ctx.db.insert("logs", {
        userId: adminId,
        action: "Salary Structure Updated",
        timestamp: now,
        details: `${admin.name} updated salary structure for ${emp.employeeId}. CTC: ${args.monthlyCTC}/mo.`,
      });

      return { message: "Salary structure updated successfully.", salaryId: existing._id };
    } else {
      const salaryId = await ctx.db.insert("salary", {
        employeeId: args.employeeId,
        userId: emp.userId,
        monthlyCTC: args.monthlyCTC,
        basicSalary: args.basicSalary,
        hra: args.hra,
        allowances: args.allowances,
        perksAndBenefits: args.perksAndBenefits,
        bonus: args.bonus,
        deductions: args.deductions,
        pf: args.pf,
        esi: args.esi,
        tds: args.tds,
        overtimeRatePerHour: args.overtimeRatePerHour,
        effectiveDate: args.effectiveDate,
        salaryStatus: args.salaryStatus,
        paymentCycle: args.paymentCycle,
        revisionHistory: [],
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("logs", {
        userId: adminId,
        action: "Salary Structure Created",
        timestamp: now,
        details: `${admin.name} created salary structure for ${emp.employeeId}. Monthly CTC: ${args.monthlyCTC}.`,
      });

      return { message: "Salary structure created successfully.", salaryId };
    }
  },
});

// ── ADMIN: Read any employee's full salary structure ──────────────────

export const getSalaryByEmployee = query({
  args: { employeeId: v.string() },
  handler: async (ctx, args) => {
    await validateAdmin(ctx);
    return await ctx.db
      .query("salary")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .first();
  },
});

// ── ADMIN: List all employees with salary summaries ───────────────────

export const getAllSalarySummaries = query({
  args: {},
  handler: async (ctx) => {
    await validateAdmin(ctx);

    const employees = await ctx.db.query("employees").collect();
    const users = await ctx.db.query("users").collect();
    const salaries = await ctx.db.query("salary").collect();

    return employees.map((emp) => {
      const user = users.find((u) => u._id === emp.userId);
      const sal = salaries.find((s) => s.employeeId === emp._id);
      return {
        employeeId: emp._id,
        empCode: emp.employeeId,
        name: user?.name ?? "Unknown",
        designation: emp.designation,
        status: emp.status,
        monthlyCTC: sal?.monthlyCTC ?? null,
        basicSalary: sal?.basicSalary ?? null,
        salaryStatus: sal?.salaryStatus ?? "Not Set",
        effectiveDate: sal?.effectiveDate ?? null,
        paymentCycle: sal?.paymentCycle ?? null,
        hasSalaryRecord: !!sal,
      };
    });
  },
});

// ── EMPLOYEE: Read own salary info (safe fields only) ─────────────────

export const getMySalaryInfo = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "employee") return null;

    const sal = await ctx.db
      .query("salary")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!sal) return null;

    return {
      basicSalary: sal.basicSalary,
      hra: sal.hra ?? 0,
      allowances: sal.allowances ?? 0,
      perksAndBenefits: sal.perksAndBenefits ?? 0,
      bonus: sal.bonus ?? 0,
      pf: sal.pf ?? 0,
      esi: sal.esi ?? 0,
      tds: sal.tds ?? 0,
      monthlyCTC: sal.monthlyCTC,
      effectiveDate: sal.effectiveDate ?? "",
      paymentCycle: sal.paymentCycle,
      salaryStatus: sal.salaryStatus,
      netTakeHome:
        Math.round(
          (sal.basicSalary +
            (sal.hra ?? 0) +
            (sal.allowances ?? 0) +
            (sal.perksAndBenefits ?? 0) +
            (sal.bonus ?? 0) -
            (sal.pf ?? 0) -
            (sal.esi ?? 0) -
            (sal.tds ?? 0) -
            (sal.deductions ?? 0)) *
            100
        ) / 100,
    };
  },
});

// ── EMPLOYEE: Real-time earnings summary ─────────────────────────────

export const getMyEarningsSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "employee") return null;

    const sal = await ctx.db
      .query("salary")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!sal) return null;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const dayOfMonth = now.getDate();
    const totalDays = daysInMonth(year, month);

    const perDaySal = calcPerDaySalary(sal.basicSalary, totalDays);

    // Get this month's attendance records
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
    const allAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const monthAttendance = allAttendance.filter((a) =>
      a.date.startsWith(monthPrefix)
    );

    const todayStr = now.toISOString().split("T")[0];
    const todayRecord = monthAttendance.find((a) => a.date === todayStr);

    let presentDays = 0;
    let halfDays = 0;
    let overtimeHours = 0;

    for (const rec of monthAttendance) {
      if (rec.status === "present" || rec.status === "late") presentDays++;
      else if (rec.status === "half-day") halfDays++;

      // Overtime: > 9 hours in a shift
      if (rec.checkIn && rec.checkOut) {
        const [inH, inM] = rec.checkIn.split(":").map(Number);
        const [outH, outM] = rec.checkOut.split(":").map(Number);
        const workedMinutes = outH * 60 + outM - (inH * 60 + inM);
        const standardMinutes = 9 * 60;
        if (workedMinutes > standardMinutes) {
          overtimeHours += (workedMinutes - standardMinutes) / 60;
        }
      }
    }

    // Count paid approved leaves this month
    const allLeaves = await ctx.db
      .query("leaves")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const paidLeaveDays = allLeaves
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
      sal.overtimeRatePerHour ?? 0
    );

    const todayEarnings = calcTodayEarnings(perDaySal, todayRecord?.status ?? null);

    const estimatedMonth = calcEstimatedMonthSalary(
      earnedSoFar,
      perDaySal,
      totalDays,
      dayOfMonth
    );

    return {
      perDaySalary: Math.round(perDaySal * 100) / 100,
      todayEarnings,
      currentMonthEarnings: earnedSoFar,
      estimatedMonthSalary: estimatedMonth,
      presentDays,
      paidLeaveDays,
      halfDays,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      totalDaysInMonth: totalDays,
      dayOfMonth,
    };
  },
});

// ── HR: Aggregate payroll stats (anonymized — no individual CTC) ──────

export const getPayrollAggregateForHR = query({
  args: {},
  handler: async (ctx) => {
    await validateHRorAdmin(ctx);

    const salaries = await ctx.db.query("salary").collect();
    const allEmployees = await ctx.db.query("employees").collect();

    const totalPayrollOutflow = salaries
      .filter((s) => s.salaryStatus === "Active")
      .reduce((acc, s) => acc + s.monthlyCTC, 0);

    const activeCount = salaries.filter((s) => s.salaryStatus === "Active").length;
    const onHoldCount = salaries.filter((s) => s.salaryStatus === "On Hold").length;
    const configuredCount = salaries.length;
    const totalEmployees = allEmployees.length;
    const missingCount = Math.max(0, totalEmployees - configuredCount);

    return {
      totalPayrollOutflow,
      activeCount,
      onHoldCount,
      configuredCount,
      missingCount,
      totalEmployees,
      averageCTC:
        configuredCount > 0 ? Math.round(totalPayrollOutflow / activeCount) : 0,
    };
  },
});
