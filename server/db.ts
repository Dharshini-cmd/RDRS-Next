import { desc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, hosts, monitoredProfiles, activityEvents, incidents, incidentEvidence, responseActions, auditLogs } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  if (!Object.keys(updateSet).length) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByEmail(email: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createLocalUser(input: { name: string; email: string; passwordHash: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const openId = `local_${randomUUID()}`;
  const result = await db.insert(users).values({
    openId,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    loginMethod: "local",
    role: "user",
    lastSignedIn: new Date(),
  }).$returningId();
  const id = result[0]?.id;
  if (!id) throw new Error("Failed to create user");
  const created = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return created[0];
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listIncidents(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(incidents).where(eq(incidents.ownerId, ownerId)).orderBy(desc(incidents.updatedAt));
}

export async function getIncident(ownerId: number, id: number) {
  const db = await getDb(); if (!db) return undefined;
  const incident = (await db.select().from(incidents).where(eq(incidents.ownerId, ownerId)).limit(100)).find(item => item.id === id);
  if (!incident) return undefined;
  const evidence = await db.select().from(incidentEvidence).where(eq(incidentEvidence.incidentId, id)).orderBy(desc(incidentEvidence.createdAt));
  const actions = await db.select().from(responseActions).where(eq(responseActions.incidentId, id)).orderBy(desc(responseActions.createdAt));
  return { incident, evidence, actions };
}

export async function listEvents(ownerId: number, limit = 80) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(activityEvents).where(eq(activityEvents.ownerId, ownerId)).orderBy(desc(activityEvents.occurredAt)).limit(limit);
}

export async function listProfiles(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(monitoredProfiles).where(eq(monitoredProfiles.ownerId, ownerId)).orderBy(desc(monitoredProfiles.updatedAt));
}

export async function listHosts(ownerId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(hosts).where(eq(hosts.ownerId, ownerId)).orderBy(desc(hosts.updatedAt));
}

export { users, hosts, monitoredProfiles, activityEvents, incidents, incidentEvidence, responseActions, auditLogs };
