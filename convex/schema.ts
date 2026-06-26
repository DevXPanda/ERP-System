import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.string()), // "admin" | "hr" | "employee"
    tokenIdentifier: v.optional(v.string()),
    departmentId: v.optional(v.string()),
    passwordHash: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("by_token", ["tokenIdentifier"]),

  officeLocation: defineTable({
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(), // configurable radius in meters
  }),

  employees: defineTable({
    userId: v.string(),
    employeeId: v.string(), // e.g. "EMP-2026-0001"
    profilePhoto: v.optional(v.string()),
    personalEmail: v.string(),
    gender: v.string(),
    dateOfBirth: v.string(),
    address: v.string(),
    emergencyContact: v.string(),
    designation: v.string(),
    reportingManagerId: v.optional(v.string()),
    employmentType: v.string(), // "Intern" | "Full-Time" | "Part-Time" | "Contract"
    joiningDate: v.string(),
    probationEndDate: v.optional(v.string()),
    officeLocation: v.string(),
    officeId: v.optional(v.string()), // Reference to officeLocation._id
    shift: v.string(),
    salary: v.optional(v.number()), // Admin only
    username: v.string(),
    status: v.string(), // "Active" | "Inactive"
    notes: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("employeeId", ["employeeId"])
    .index("username", ["username"]),

  departments: defineTable({
    name: v.string(),
    code: v.string(),
    managerId: v.optional(v.string()),
    employeeCount: v.number(),
  }),

  attendance: defineTable({
    userId: v.string(),
    date: v.string(), // YYYY-MM-DD
    checkIn: v.string(), // HH:MM
    checkOut: v.optional(v.string()), // HH:MM
    status: v.string(), // "present" | "absent" | "late"
    location: v.optional(v.string()),
    adminRemarks: v.optional(v.string()),   // Admin note on this record
    adminEditedAt: v.optional(v.number()),  // Timestamp of last admin edit
    adminEditedBy: v.optional(v.string()),  // Name of admin who last edited
    
    // GPS Geofencing details
    officeId: v.optional(v.string()),
    latitude: v.optional(v.number()),       // check-in latitude
    longitude: v.optional(v.number()),      // check-in longitude
    distance: v.optional(v.number()),       // check-in distance from office (meters)
    timestamp: v.optional(v.number()),      // check-in epoch timestamp
    
    checkOutLatitude: v.optional(v.number()),
    checkOutLongitude: v.optional(v.number()),
    checkOutDistance: v.optional(v.number()),
    checkOutTimestamp: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  logs: defineTable({
    userId: v.optional(v.string()),
    action: v.string(),
    timestamp: v.number(),
    details: v.string(),
  }).index("by_timestamp", ["timestamp"]),

  notifications: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    read: v.boolean(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),

  leaves: defineTable({
    userId: v.string(),
    type: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
    status: v.string(), // "Pending" | "Approved" | "Rejected"
    appliedOn: v.number(),
  }).index("by_user", ["userId"]),

  holidays: defineTable({
    name: v.string(),
    date: v.string(),
    type: v.string(), // "National" | "Regional" | "Corporate"
  }),

  documents: defineTable({
    userId: v.string(),
    name: v.string(),
    fileUrl: v.string(),
    uploadedAt: v.number(),
    type: v.string(),
  }).index("by_user", ["userId"]),

  payroll: defineTable({
    userId: v.string(),
    month: v.string(),
    baseSalary: v.number(),
    allowances: v.number(),
    deductions: v.number(),
    netSalary: v.number(),
    status: v.string(), // "Paid" | "Pending"
    paymentDate: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  salary: defineTable({
    employeeId: v.string(),       // references employees._id
    userId: v.string(),           // references users._id
    monthlyCTC: v.number(),       // Total Cost to Company per month
    basicSalary: v.number(),      // Basic component (PF basis)
    hra: v.optional(v.number()),              // House Rent Allowance
    allowances: v.optional(v.number()),       // Special / travel / misc allowances
    perksAndBenefits: v.optional(v.number()), // Meal, insurance, club etc.
    bonus: v.optional(v.number()),            // Performance / joining bonus (monthly accrual)
    deductions: v.optional(v.number()),       // Other statutory deductions
    pf: v.optional(v.number()),               // Provident Fund (employee share)
    esi: v.optional(v.number()),              // Employee State Insurance
    tds: v.optional(v.number()),              // Tax Deducted at Source (monthly)
    overtimeRatePerHour: v.optional(v.number()), // e.g. 1.5x hourly
    effectiveDate: v.optional(v.string()),    // YYYY-MM-DD — when this structure took effect
    salaryStatus: v.string(),     // "Active" | "On Hold" | "Revised"
    paymentCycle: v.string(),     // "Monthly" | "Bi-weekly"
    revisionHistory: v.array(
      v.object({
        date: v.string(),         // YYYY-MM-DD
        revisedBy: v.string(),    // Admin user name
        oldCTC: v.number(),
        newCTC: v.number(),
        reason: v.string(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employee", ["employeeId"])
    .index("by_user", ["userId"]),

  tasks: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.string(),
    dueDate: v.string(),
    priority: v.string(), // "Low" | "Medium" | "High"
    status: v.string(), // "Pending" | "In-Progress" | "Completed"
  }).index("by_user", ["userId"]),

  notices: defineTable({
    title: v.string(),
    content: v.string(),
    publishedAt: v.number(),
    targetRoles: v.optional(v.array(v.string())),
  }),

  candidates: defineTable({
    name: v.string(),
    role: v.string(),
    email: v.string(),
    phone: v.string(),
    stage: v.string(), // "Applied" | "Screening" | "Interview" | "Offered" | "Rejected"
    score: v.number(),
  }),

  performance: defineTable({
    userId: v.string(),
    rating: v.number(),
    feedback: v.string(),
    reviewPeriod: v.string(),
    reviewedBy: v.string(),
  }).index("by_user", ["userId"]),

  queries: defineTable({
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    type: v.string(), // "Resignation" | "Support"
    subject: v.string(),
    description: v.string(),
    status: v.string(), // "Pending HR Review" | "Approved by HR" | "Rejected by HR" | "Pending Admin Review" | "Approved by Admin" | "Rejected by Admin"
    createdAt: v.number(),
    resignationDate: v.optional(v.string()),
    position: v.optional(v.string()),
    hrRemarks: v.optional(v.string()),
    adminRemarks: v.optional(v.string()),
    hrReviewedAt: v.optional(v.number()),
    adminReviewedAt: v.optional(v.number()),
    hrReviewedBy: v.optional(v.string()),
    adminReviewedBy: v.optional(v.string()),
    noticePeriod: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
