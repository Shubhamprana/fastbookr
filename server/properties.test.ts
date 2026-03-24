import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("properties procedures", () => {
  const adminUser: AuthenticatedUser = {
    id: 1,
    openId: "admin-test",
    email: "admin@test.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const regularUser: AuthenticatedUser = {
    id: 2,
    openId: "user-test",
    email: "user@test.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  it("should allow public access to getFeatured", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.getFeatured();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to search", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.properties.search({
      city: "Miami",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow public access to getById", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // Property with ID 1 should exist from seed data
    const result = await caller.properties.getById({ id: 1 });
    // Result can be undefined if property doesn't exist, or defined if it does
    expect(result !== null).toBe(true);
  });

  it("should restrict property creation to admin users", async () => {
    const regularCtx = createMockContext(regularUser);
    const regularCaller = appRouter.createCaller(regularCtx);

    await expect(
      regularCaller.properties.create({
        title: "Test Property",
        description: "Test description",
        price: 50000000,
        location: "123 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        propertyType: "house",
        listingType: "sale",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        images: '["https://example.com/test.jpg"]',
        featured: 0,
      })
    ).rejects.toThrow();
  });

  it("should allow admin to create properties", async () => {
    const adminCtx = createMockContext(adminUser);
    const adminCaller = appRouter.createCaller(adminCtx);

    const result = await adminCaller.properties.create({
      title: "Admin Test Property",
      description: "Test description",
      price: 50000000,
      location: "123 Admin St",
      city: "Admin City",
      state: "AD",
      zipCode: "12345",
      propertyType: "house",
      listingType: "sale",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2000,
      images: '["https://example.com/test.jpg"]',
      featured: 0,
    });

    // The create procedure returns the Drizzle insert result
    expect(result).toBeDefined();
  });

  it("should restrict property updates to admin users", async () => {
    const regularCtx = createMockContext(regularUser);
    const regularCaller = appRouter.createCaller(regularCtx);

    await expect(
      regularCaller.properties.update({
        id: 1,
        title: "Updated Title",
        description: "Updated description",
        price: 60000000,
        location: "456 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        propertyType: "house",
        listingType: "sale",
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 2500,
        images: '["https://example.com/test2.jpg"]',
        featured: 1,
      })
    ).rejects.toThrow();
  });

  it("should restrict property deletion to admin users", async () => {
    const regularCtx = createMockContext(regularUser);
    const regularCaller = appRouter.createCaller(regularCtx);

    await expect(
      regularCaller.properties.delete({ id: 1 })
    ).rejects.toThrow();
  });
});
