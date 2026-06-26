import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { auth } from "./auth";
import { Id } from "./_generated/dataModel";

// Helper to validate only Admin users
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

// Helper to validate any authenticated user
async function validateAuthenticatedUser(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (userId === null) {
    throw new Error("Unauthorized");
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// Default NKTech Head Office credentials
export const DEFAULT_OFFICE = {
  name: "NKTech Head Office",
  address: "ITHUM Tower, 3rd Floor, Office 307B, A-40, Sector 62, Noida, Uttar Pradesh 201301",
  latitude: 28.626568,
  longitude: 77.3723755,
  radius: 30, // 30 meters
};

/**
 * Get all office locations.
 * Automatically seeds the default office location if none exist.
 */
export const getOffices = query({
  args: {},
  handler: async (ctx) => {
    await validateAuthenticatedUser(ctx);

    const offices = await ctx.db.query("officeLocation").collect();
    if (offices.length === 0) {
      return [
        {
          _id: "default" as any,
          _creationTime: Date.now(),
          ...DEFAULT_OFFICE,
        },
      ];
    }
    return offices;
  },
});

/**
 * Get office location by its unique ID.
 */
export const getOfficeById = query({
  args: { officeId: v.id("officeLocation") },
  handler: async (ctx, args) => {
    await validateAuthenticatedUser(ctx);
    const office = await ctx.db.get(args.officeId);
    if (!office) {
      throw new Error("Office location not found");
    }
    return office;
  },
});

/**
 * Create a new office location. Strictly Admin-only.
 */
export const createOffice = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await validateAdmin(ctx);

    const officeId = await ctx.db.insert("officeLocation", {
      name: args.name,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      radius: args.radius,
    });

    // Log the creation
    await ctx.db.insert("logs", {
      userId: admin._id,
      action: "Office Location Created",
      timestamp: Date.now(),
      details: `${admin.name} (Admin) created office "${args.name}" at Lat: ${args.latitude}, Lng: ${args.longitude} with ${args.radius}m radius.`,
    });

    return officeId;
  },
});

/**
 * Update an existing office location. Strictly Admin-only.
 */
export const updateOffice = mutation({
  args: {
    officeId: v.id("officeLocation"),
    name: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await validateAdmin(ctx);

    const currentOffice = await ctx.db.get(args.officeId);
    if (!currentOffice) {
      throw new Error("Office location not found");
    }

    await ctx.db.patch(args.officeId, {
      name: args.name,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      radius: args.radius,
    });

    // Log the update
    await ctx.db.insert("logs", {
      userId: admin._id,
      action: "Office Location Updated",
      timestamp: Date.now(),
      details: `${admin.name} (Admin) updated office "${args.name}" (ID: ${args.officeId}). New coordinates: Lat ${args.latitude}, Lng ${args.longitude}. Radius: ${args.radius}m.`,
    });

    return { success: true };
  },
});

/**
 * Delete an office location. Strictly Admin-only.
 */
export const deleteOffice = mutation({
  args: { officeId: v.id("officeLocation") },
  handler: async (ctx, args) => {
    const admin = await validateAdmin(ctx);

    const office = await ctx.db.get(args.officeId);
    if (!office) {
      throw new Error("Office location not found");
    }

    // Check if it's the only office - let's prevent deleting all offices to ensure we always have one
    const offices = await ctx.db.query("officeLocation").collect();
    if (offices.length <= 1) {
      throw new Error("Cannot delete the only remaining office location. Please create another office first.");
    }

    await ctx.db.delete(args.officeId);

    // Log the deletion
    await ctx.db.insert("logs", {
      userId: admin._id,
      action: "Office Location Deleted",
      timestamp: Date.now(),
      details: `${admin.name} (Admin) deleted office location "${office.name}" (ID: ${args.officeId}).`,
    });

    return { success: true };
  },
});
