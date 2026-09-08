import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb, listEvents, listHosts, listIncidents, listProfiles, getIncident, getUserByEmail, createLocalUser, hosts, monitoredProfiles, activityEvents, incidents, incidentEvidence, responseActions, auditLogs } from "./db";
import { scoreActivity } from "./risk";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { hashPassword, verifyPassword } from "./_core/localAuth";
import { sdk } from "./_core/sdk";

const eventInput = z.object({
  hostId: z.number().int().positive(),
  profileId: z.number().int().positive(),
  source: z.enum(["agent", "simulation"]),
  correlationId: z.string().min(4).max(128),
  eventType: z.enum(["create", "modify", "rename", "delete"]),
  filePath: z.string().min(1).max(1000),
  oldExtension: z.string().max(32).nullable().optional(),
  newExtension: z.string().max(32).nullable().optional(),
  fileSize: z.number().int().nonnegative().nullable().optional(),
  processName: z.string().max(160).nullable().optional(),
  isProtectedPath: z.boolean().default(false),
  occurredAt: z.coerce.date().default(() => new Date()),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new Error("Administrator access required");
  return next();
});

async function ensureDemoProfile(ownerId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const existingHost = (await db.select().from(hosts).where(eq(hosts.ownerId, ownerId)).limit(1))[0];
  const host = existingHost ?? (await db.insert(hosts).values({ ownerId, hostKey: `demo-${ownerId}`, displayName: "Analyst workstation", platform: "Simulation", agentVersion: "simulator", status: "online", lastHeartbeatAt: new Date() }).$returningId())[0];
  const hostId = existingHost?.id ?? host.id;
  const existingProfile = (await db.select().from(monitoredProfiles).where(eq(monitoredProfiles.ownerId, ownerId)).limit(1))[0];
  const profile = existingProfile ?? (await db.insert(monitoredProfiles).values({ ownerId, hostId, name: "Safe test folder", testFolder: "/authorized/test-folder", quarantineDirectory: "/authorized/quarantine", enabled: true, riskThreshold: 65, protectedImpactWeight: 25 }).$returningId())[0];
  return { hostId, profileId: existingProfile?.id ?? profile.id };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    register: publicProcedure.input(z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().toLowerCase().email().max(320),
      password: z.string().min(8).max(200),
    })).mutation(async ({ ctx, input }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) throw new Error("An account with this email already exists");
      const passwordHash = await hashPassword(input.password);
      const user = await createLocalUser({ name: input.name, email: input.email, passwordHash });
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || input.email });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 365 });
      return { success: true } as const;
    }),
    login: publicProcedure.input(z.object({
      email: z.string().trim().toLowerCase().email().max(320),
      password: z.string().min(1).max(200),
    })).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email);
      if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new Error("Invalid email or password");
      }
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || input.email });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 1000 * 60 * 60 * 24 * 365 });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const [events, incidentRows, hostRows, profileRows] = await Promise.all([listEvents(ctx.user.id, 250), listIncidents(ctx.user.id), listHosts(ctx.user.id), listProfiles(ctx.user.id)]);
      const active = incidentRows.filter(item => !["resolved", "false_positive"].includes(item.status));
      const critical = active.filter(item => item.severity === "critical").length;
      return { events, incidents: incidentRows.slice(0, 8), activeIncidents: active.length, criticalIncidents: critical, hosts: hostRows, profiles: profileRows, telemetry24h: events.length };
    }),
    events: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(250).default(80) })).query(({ ctx, input }) => listEvents(ctx.user.id, input.limit)),
    incidents: protectedProcedure.query(({ ctx }) => listIncidents(ctx.user.id)),
    incident: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getIncident(ctx.user.id, input.id)),
    profiles: protectedProcedure.query(({ ctx }) => listProfiles(ctx.user.id)),
    hosts: protectedProcedure.query(({ ctx }) => listHosts(ctx.user.id)),
  }),
  telemetry: router({
    ingest: adminProcedure.input(eventInput).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const inserted = await db.insert(activityEvents).values({ ...input, ownerId: ctx.user.id, oldExtension: input.oldExtension ?? null, newExtension: input.newExtension ?? null, fileSize: input.fileSize ?? null, processName: input.processName ?? null });
      return { accepted: true, eventId: Number(inserted[0].insertId) };
    }),
    heartbeat: adminProcedure.input(z.object({ hostId: z.number().int().positive(), status: z.enum(["online", "offline", "paused"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      await db.update(hosts).set({ status: input.status, lastHeartbeatAt: new Date() }).where(eq(hosts.id, input.hostId));
      return { success: true } as const;
    }),
    simulate: protectedProcedure.input(z.object({ preset: z.enum(["benign", "backup", "rename_burst", "ransomware_burst"]) })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const { hostId, profileId } = await ensureDemoProfile(ctx.user.id);
      const correlationId = `sim-${nanoid(10)}`;
      const now = Date.now();
      const count = input.preset === "benign" ? 4 : input.preset === "backup" ? 10 : input.preset === "rename_burst" ? 9 : 18;
      const eventType = input.preset === "rename_burst" || input.preset === "ransomware_burst" ? "rename" : "modify";
      const events = Array.from({ length: count }, (_, index) => ({ ownerId: ctx.user.id, hostId, profileId, source: "simulation" as const, correlationId, eventType: eventType as "modify" | "rename", filePath: `/authorized/test-folder/${input.preset}-${index + 1}.txt`, oldExtension: eventType === "rename" ? ".txt" : null, newExtension: eventType === "rename" ? ".locked" : null, fileSize: 2048 + index * 100, processName: "safe-simulator", isProtectedPath: input.preset === "ransomware_burst" && index < 4, occurredAt: new Date(now - (count - index) * 2200) }));
      await db.insert(activityEvents).values(events);
      const score = scoreActivity(events, 25);
      const created = await db.insert(incidents).values({ ownerId: ctx.user.id, hostId, profileId, correlationId, source: "simulation", severity: score.severity, status: score.riskScore >= 35 ? "open" : "resolved", riskScore: score.riskScore, title: `${input.preset.replace("_", " ")} activity observed`, explanation: score.explanation, affectedEventCount: events.length, firstObservedAt: events[0].occurredAt, lastObservedAt: events[events.length - 1].occurredAt }).$returningId();
      const incidentId = created[0].id;
      if (score.signals.length) await db.insert(incidentEvidence).values(score.signals.map(signal => ({ incidentId, eventId: 0, signal: signal.signal, contribution: signal.contribution, details: signal.details })));
      await db.insert(auditLogs).values({ ownerId: ctx.user.id, actorId: ctx.user.id, entityType: "incident", entityId: incidentId, action: "simulation_created", metadata: { preset: input.preset, source: "simulation" } });
      return { incidentId, eventCount: events.length, ...score, source: "simulation" as const };
    }),
  }),
  response: router({
    updateIncident: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), status: z.enum(["acknowledged", "assigned", "escalated", "resolved", "false_positive"]), note: z.string().max(2000).optional() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const owned = (await db.select().from(incidents).where(eq(incidents.ownerId, ctx.user.id))).find(item => item.id === input.incidentId);
      if (!owned) throw new Error("Incident not found");
      await db.update(incidents).set({ status: input.status, assignedTo: input.status === "assigned" ? ctx.user.id : owned.assignedTo }).where(eq(incidents.id, input.incidentId));
      await db.insert(responseActions).values({ incidentId: input.incidentId, actorId: ctx.user.id, action: input.status, note: input.note ?? null });
      await db.insert(auditLogs).values({ ownerId: ctx.user.id, actorId: ctx.user.id, entityType: "incident", entityId: input.incidentId, action: input.status, metadata: input.note ? { note: input.note } : null });
      return { success: true } as const;
    }),
    quarantine: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), targetPath: z.string().min(1), confirm: z.literal(true) })).mutation(async ({ ctx, input }) => {
      if (!input.targetPath.includes("/authorized/test-folder/") || input.targetPath.includes("/quarantine/")) throw new Error("Quarantine is restricted to an explicitly selected test artifact inside the authorized test folder");
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const owned = (await db.select().from(incidents).where(eq(incidents.ownerId, ctx.user.id))).find(item => item.id === input.incidentId);
      if (!owned) throw new Error("Incident not found");
      await db.insert(responseActions).values({ incidentId: input.incidentId, actorId: ctx.user.id, action: "quarantine_requested", note: "Confirmed local-only quarantine request", targetPath: input.targetPath });
      await db.insert(auditLogs).values({ ownerId: ctx.user.id, actorId: ctx.user.id, entityType: "incident", entityId: input.incidentId, action: "quarantine_requested", metadata: { targetPath: input.targetPath, localOnly: true } });
      return { success: true, localOnly: true } as const;
    }),
    toggleProfile: protectedProcedure.input(z.object({ profileId: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db) throw new Error("Database unavailable");
      const profile = (await db.select().from(monitoredProfiles).where(eq(monitoredProfiles.ownerId, ctx.user.id))).find(item => item.id === input.profileId);
      if (!profile) throw new Error("Profile not found");
      await db.update(monitoredProfiles).set({ enabled: input.enabled }).where(eq(monitoredProfiles.id, input.profileId));
      await db.insert(auditLogs).values({ ownerId: ctx.user.id, actorId: ctx.user.id, entityType: "profile", entityId: input.profileId, action: input.enabled ? "enabled" : "disabled", metadata: null });
      return { success: true } as const;
    }),
  }),
  reports: router({
    generate: protectedProcedure.input(z.object({ incidentId: z.number().int().positive(), format: z.enum(["json", "markdown", "csv"]) })).query(async ({ ctx, input }) => {
      const detail = await getIncident(ctx.user.id, input.incidentId);
      if (!detail) throw new Error("Incident not found");
      const { incident, evidence, actions } = detail;
      if (input.format === "json") return JSON.stringify({ incident, evidence, actions }, null, 2);
      if (input.format === "csv") return ["timestamp,signal,contribution,details", ...evidence.map(item => `${item.createdAt.toISOString()},${item.signal},${item.contribution},${JSON.stringify(item.details)}`)].join("\\n");
      return `# ${incident.title}\\n\\n- Severity: ${incident.severity}\\n- Risk score: ${incident.riskScore}/100\\n- Source: ${incident.source}\\n- Status: ${incident.status}\\n\\n## Explanation\\n${incident.explanation}\\n\\n## Response actions\\n${actions.map(action => `- ${action.action}: ${action.note || "No note"}`).join("\\n") || "No response actions recorded."}`;
    }),
  }),
});

export type AppRouter = typeof appRouter;
