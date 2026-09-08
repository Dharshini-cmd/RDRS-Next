import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const hosts = mysqlTable("rdrs_hosts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  hostKey: varchar("hostKey", { length: 128 }).notNull().unique(),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  platform: varchar("platform", { length: 80 }).notNull(),
  agentVersion: varchar("agentVersion", { length: 40 }),
  status: mysqlEnum("status", ["online", "offline", "paused"]).default("offline").notNull(),
  lastHeartbeatAt: timestamp("lastHeartbeatAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const monitoredProfiles = mysqlTable("rdrs_profiles", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  hostId: int("hostId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  testFolder: text("testFolder").notNull(),
  quarantineDirectory: text("quarantineDirectory").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  riskThreshold: int("riskThreshold").default(65).notNull(),
  protectedImpactWeight: int("protectedImpactWeight").default(25).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const activityEvents = mysqlTable("rdrs_activity_events", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  hostId: int("hostId").notNull(),
  profileId: int("profileId").notNull(),
  source: mysqlEnum("source", ["agent", "simulation"]).notNull(),
  correlationId: varchar("correlationId", { length: 128 }).notNull(),
  eventType: mysqlEnum("eventType", ["create", "modify", "rename", "delete"]).notNull(),
  filePath: text("filePath").notNull(),
  oldExtension: varchar("oldExtension", { length: 32 }),
  newExtension: varchar("newExtension", { length: 32 }),
  fileSize: int("fileSize"),
  processName: varchar("processName", { length: 160 }),
  isProtectedPath: boolean("isProtectedPath").default(false).notNull(),
  occurredAt: timestamp("occurredAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const incidents = mysqlTable("rdrs_incidents", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  hostId: int("hostId").notNull(),
  profileId: int("profileId").notNull(),
  correlationId: varchar("correlationId", { length: 128 }).notNull(),
  source: mysqlEnum("source", ["agent", "simulation"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  status: mysqlEnum("status", ["open", "acknowledged", "assigned", "escalated", "resolved", "false_positive"]).default("open").notNull(),
  riskScore: int("riskScore").notNull(),
  title: varchar("title", { length: 220 }).notNull(),
  explanation: text("explanation").notNull(),
  affectedEventCount: int("affectedEventCount").default(0).notNull(),
  assignedTo: int("assignedTo"),
  firstObservedAt: timestamp("firstObservedAt").notNull(),
  lastObservedAt: timestamp("lastObservedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const incidentEvidence = mysqlTable("rdrs_incident_evidence", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  eventId: int("eventId").notNull(),
  signal: varchar("signal", { length: 120 }).notNull(),
  contribution: int("contribution").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const responseActions = mysqlTable("rdrs_response_actions", {
  id: int("id").autoincrement().primaryKey(),
  incidentId: int("incidentId").notNull(),
  actorId: int("actorId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  note: text("note"),
  targetPath: text("targetPath"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const reports = mysqlTable("rdrs_reports", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  incidentId: int("incidentId").notNull(),
  format: mysqlEnum("format", ["json", "markdown", "csv"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("rdrs_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  actorId: int("actorId").notNull(),
  entityType: varchar("entityType", { length: 60 }).notNull(),
  entityId: int("entityId").notNull(),
  action: varchar("action", { length: 80 }).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Host = typeof hosts.$inferSelect;
export type MonitoredProfile = typeof monitoredProfiles.$inferSelect;
export type ActivityEvent = typeof activityEvents.$inferSelect;
export type Incident = typeof incidents.$inferSelect;
export type IncidentEvidence = typeof incidentEvidence.$inferSelect;
export type ResponseAction = typeof responseActions.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
