// This file is crucial for formatting the drizzle schema

import { mysqlTable, mysqlSchema, varchar, boolean, text, int, timestamp, primaryKey } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// Users Table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  username: varchar("username", { length: 255 }).unique(),
  passwordHash: text("passwordHash"),
  title: varchar("title", { length: 50 }),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  email: varchar("email", { length: 255 }),
  admin: boolean("admin").default(false),
});

// Password Resets Table
export const userPwdResets = mysqlTable("user_pwd_resets", {
  id: int("id").primaryKey().autoincrement(),
  userId: varchar("userId", { length: 36 }).notNull(),
  code: varchar("code", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

// Sessions Table
export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`(UUID())`),
  userId: varchar("userId", { length: 36 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});