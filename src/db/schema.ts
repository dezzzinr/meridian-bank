import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: ["checking", "savings"] })
      .notNull()
      .default("checking"),
    last4: text("last4").notNull(),
    balanceCents: bigint("balance_cents", { mode: "number" })
      .notNull()
      .default(0),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const payees = pgTable(
  "payees",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    methodType: text("method_type", { enum: ["bank", "email", "mobile"] })
      .notNull()
      .default("bank"),
    methodDetail: text("method_detail").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payees_user_idx").on(t.userId)],
);

export const transfers = pgTable(
  "transfers",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceAccountId: integer("source_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    destinationAccountId: integer("destination_account_id").references(
      () => accounts.id,
      { onDelete: "set null" },
    ),
    payeeId: integer("payee_id").references(() => payees.id, {
      onDelete: "set null",
    }),
    amountCents: integer("amount_cents").notNull(),
    note: text("note"),
    status: text("status", { enum: ["pending", "completed", "voided"] })
      .notNull()
      .default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("transfers_user_idx").on(t.userId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    transferId: integer("transfer_id").references(() => transfers.id, {
      onDelete: "set null",
    }),
    payeeId: integer("payee_id").references(() => payees.id, {
      onDelete: "set null",
    }),
    kind: text("kind", {
      enum: ["credit", "debit", "payment", "transfer_in", "transfer_out"],
    }).notNull(),
    category: text("category").notNull().default("Other"),
    description: text("description").notNull(),
    note: text("note"),
    amountCents: integer("amount_cents").notNull(),
    status: text("status", { enum: ["pending", "completed", "voided"] })
      .notNull()
      .default("completed"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("transactions_user_idx").on(t.userId),
    index("transactions_account_time_idx").on(t.accountId, t.occurredAt),
  ],
);
