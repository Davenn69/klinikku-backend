import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  date,
  time,
  integer,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/* ============================================================
   USERS
============================================================ */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 20 }).notNull().default("patient"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    roleCheck: check(
      "users_role_check",
      sql`${table.role} IN ('patient','admin','doctor')`,
    ),
  }),
);

/* ============================================================
   REFRESH TOKENS
============================================================ */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revoked: boolean("revoked").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("idx_refresh_tokens_user_id").on(table.userId),
    tokenIdx: index("idx_refresh_tokens_token_hash").on(table.tokenHash),
    tokenUnique: uniqueIndex("refresh_tokens_token_unique").on(table.tokenHash),
  }),
);

/* ============================================================
   REGIONS
============================================================ */
export const regions = pgTable(
  "regions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    code: varchar("code", { length: 20 }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    codeIdx: index("idx_regions_code").on(table.code),
    codeUnique: uniqueIndex("regions_code_unique").on(table.code),
  }),
);

/* ============================================================
   DOCTORS
============================================================ */
export const doctors = pgTable(
  "doctors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 150 }).notNull(),
    specialization: varchar("specialization", { length: 150 }).notNull(),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "restrict" }),
    licenseNumber: varchar("license_number", { length: 50 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    regionIdx: index("idx_doctors_region_id").on(table.regionId),
  }),
);

/* ============================================================
   APPOINTMENT SLOTS
============================================================ */
export const appointmentSlots = pgTable(
  "appointment_slots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "cascade" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "cascade" }),
    slotDate: date("slot_date").notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
    maxCapacity: integer("max_capacity").notNull().default(1),
    bookedCount: integer("booked_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    doctorIdx: index("idx_slots_doctor_id").on(table.doctorId),
    regionIdx: index("idx_slots_region_id").on(table.regionId),
    dateIdx: index("idx_slots_date").on(table.slotDate),
    lookupIdx: index("idx_slots_lookup").on(
      table.regionId,
      table.doctorId,
      table.slotDate,
      table.isAvailable,
    ),
    timeCheck: check(
      "chk_slot_time",
      sql`${table.endTime} > ${table.startTime}`,
    ),
    capacityCheck: check(
      "chk_booked_capacity",
      sql`${table.bookedCount} <= ${table.maxCapacity}`,
    ),
  }),
);

/* ============================================================
   ENCOUNTERS
============================================================ */
export const encounters = pgTable(
  "encounters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bookingCode: varchar("booking_code", { length: 30 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    doctorId: uuid("doctor_id")
      .notNull()
      .references(() => doctors.id, { onDelete: "restrict" }),
    regionId: uuid("region_id")
      .notNull()
      .references(() => regions.id, { onDelete: "restrict" }),
    appointmentSlotId: uuid("appointment_slot_id")
      .notNull()
      .references(() => appointmentSlots.id, { onDelete: "restrict" }),
    complaint: text("complaint"),
    status: varchar("status", { length: 20 }).notNull().default("BOOKED"),
    cancelledReason: text("cancelled_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("idx_encounters_user_id").on(table.userId),
    statusIdx: index("idx_encounters_status").on(table.status),
    slotIdx: index("idx_encounters_slot_id").on(table.appointmentSlotId),
    codeIdx: index("idx_encounters_code").on(table.bookingCode),
    codeUnique: uniqueIndex("encounters_code_unique").on(table.bookingCode),
    statusCheck: check(
      "encounters_status_check",
      sql`${table.status} IN ('BOOKED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW')`,
    ),
  }),
);
