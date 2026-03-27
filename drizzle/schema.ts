import {
  double,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 128 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: int("price").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  zipCode: varchar("zipCode", { length: 20 }),
  propertyType: mysqlEnum("propertyType", [
    "house",
    "apartment",
    "condo",
    "townhouse",
    "villa",
    "land",
    "room",
    "studio",
    "shared-room",
    "pg/hostel",
    "independent-floor",
  ]).notNull(),
  listingType: mysqlEnum("listingType", ["sale", "rent", "co-living"]).notNull(),
  bedrooms: int("bedrooms").notNull(),
  bathrooms: int("bathrooms").notNull(),
  squareFeet: int("squareFeet").notNull(),
  images: text("images").notNull(),
  featured: tinyint("featured").default(0).notNull(),
  status: mysqlEnum("status", ["available", "pending", "sold"])
    .default("available")
    .notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"])
    .default("pending")
    .notNull(),
  feeStatus: mysqlEnum("feeStatus", ["open", "won", "paid"]).default("open").notNull(),
  createdBy: varchar("createdBy", { length: 36 })
    .notNull()
    .references(() => users.id),
  ownerName: varchar("ownerName", { length: 255 }),
  ownerEmail: varchar("ownerEmail", { length: 320 }),
  ownerPhone: varchar("ownerPhone", { length: 50 }),
  latitude: double("latitude"),
  longitude: double("longitude"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId")
    .notNull()
    .references(() => properties.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

export const ownerMessages = mysqlTable("ownerMessages", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId")
    .notNull()
    .references(() => properties.id),
  senderRole: mysqlEnum("senderRole", ["admin", "owner"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OwnerMessage = typeof ownerMessages.$inferSelect;
export type InsertOwnerMessage = typeof ownerMessages.$inferInsert;

export const platformSettings = mysqlTable("platformSettings", {
  id: int("id").primaryKey(),
  teamName: varchar("teamName", { length: 255 }).notNull(),
  tagline: text("tagline").notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = typeof platformSettings.$inferInsert;

export const contactMessages = mysqlTable("contactMessages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "reviewed", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;
