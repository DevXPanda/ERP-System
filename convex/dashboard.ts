import { query, QueryCtx } from "./_generated/server";
import { auth } from "./auth";

// Server-side authorization check helper
async function validateRole(ctx: QueryCtx) {
  const userId = await auth.getUserId(ctx);
  if (userId === null) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db.get(userId);
  if (!user || (user.role !== "admin" && user.role !== "hr")) {
    throw new Error("Forbidden"); // Prevents any unauthorized data leakage
  }
  return user;
}

// Fetch dashboard KPI analytics counters
export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await validateRole(ctx);

    const employees = await ctx.db.query("users").collect();
    const departments = await ctx.db.query("departments").collect();
    
    // Calculate checked in today count
    const today = new Date().toISOString().split("T")[0];
    const attendanceToday = await ctx.db
      .query("attendance")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    
    const activeShiftsCount = attendanceToday.filter((a) => !a.checkOut).length;

    return {
      totalEmployees: employees.length,
      activeShifts: activeShiftsCount,
      totalDepartments: departments.length,
      productivityTrend: employees.length > 0 ? `+${Math.round((activeShiftsCount / employees.length) * 100)}%` : "0%",
    };
  },
});

// Fetch chart datasets for lines and bars dynamically
export const getChartData = query({
  args: {},
  handler: async (ctx) => {
    await validateRole(ctx);

    const users = await ctx.db.query("users").collect();
    const departments = await ctx.db.query("departments").collect();

    // Sort users by _creationTime ascending
    const sortedUsers = [...users].sort((a, b) => a._creationTime - b._creationTime);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const growthMap: { [key: string]: number } = {};
    months.forEach((m) => {
      growthMap[m] = 0;
    });

    sortedUsers.forEach((u) => {
      const date = new Date(u._creationTime);
      const m = months[date.getMonth()];
      growthMap[m] = (growthMap[m] || 0) + 1;
    });

    const employeeGrowth = [];
    let cumulative = 0;
    const currentMonthIndex = new Date().getMonth();
    for (let i = 0; i <= currentMonthIndex; i++) {
      const m = months[i];
      cumulative += growthMap[m];
      employeeGrowth.push({ month: m, count: cumulative });
    }

    // Department distribution
    const departmentDistribution = departments.map((d) => {
      const count = users.filter((u) => u.departmentId === d._id).length;
      return { name: d.code, count };
    });

    return {
      employeeGrowth,
      departmentDistribution,
    };
  },
});

// Fetch audit trail logs
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    await validateRole(ctx);
    return await ctx.db
      .query("logs")
      .order("desc")
      .take(5);
  },
});

// Fetch full employee listing
export const getEmployeeOverview = query({
  args: {},
  handler: async (ctx) => {
    await validateRole(ctx);

    const users = await ctx.db.query("users").collect();
    const departments = await ctx.db.query("departments").collect();
    
    // Map department data to users
    return users.map((u) => {
      const dept = departments.find((d) => d._id === u.departmentId);
      return {
        _id: u._id,
        name: u.name || "Unnamed Employee",
        email: u.email,
        role: u.role,
        department: dept ? dept.name : "Unassigned",
        deptCode: dept ? dept.code : "N/A",
        status: u.role === "admin" ? "Active" : u.role === "hr" ? "Active" : "On Duty",
      };
    });
  },
});
