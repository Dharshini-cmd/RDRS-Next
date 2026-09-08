import type { Express, Request, Response } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, activityEvents, hosts } from "./db";

const eventSchema = z.object({
  hostId: z.number().int().positive(), profileId: z.number().int().positive(), source: z.literal("agent"), correlationId: z.string().min(4),
  eventType: z.enum(["create", "modify", "rename", "delete"]), filePath: z.string().min(1),
  oldExtension: z.string().nullable().optional(), newExtension: z.string().nullable().optional(), fileSize: z.number().int().nonnegative().nullable().optional(),
  processName: z.string().nullable().optional(), isProtectedPath: z.boolean().default(false), occurredAt: z.coerce.date(),
});
const heartbeatSchema = z.object({ hostId: z.number().int().positive(), status: z.enum(["online", "offline", "paused"]) });

function authorized(req: Request) {
  const expected = process.env.RDRS_AGENT_TOKEN || "dev-agent-token";
  return req.headers.authorization === `Bearer ${expected}`;
}

export function registerAgentRoutes(app: Express) {
  app.post("/api/telemetry/ingest", async (req: Request, res: Response) => {
    if (!authorized(req)) return res.status(401).json({ error: "Invalid agent token" });
    const parsed = eventSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid telemetry payload" });
    const db = await getDb(); if (!db) return res.status(503).json({ error: "Database unavailable" });
    const host = (await db.select().from(hosts).where(eq(hosts.id, parsed.data.hostId)).limit(1))[0];
    if (!host) return res.status(404).json({ error: "Host not enrolled" });
    const result = await db.insert(activityEvents).values({ ...parsed.data, ownerId: host.ownerId, oldExtension: parsed.data.oldExtension ?? null, newExtension: parsed.data.newExtension ?? null, fileSize: parsed.data.fileSize ?? null, processName: parsed.data.processName ?? null });
    return res.json({ accepted: true, eventId: Number(result[0].insertId) });
  });
  app.post("/api/telemetry/heartbeat", async (req: Request, res: Response) => {
    if (!authorized(req)) return res.status(401).json({ error: "Invalid agent token" });
    const parsed = heartbeatSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid heartbeat payload" });
    const db = await getDb(); if (!db) return res.status(503).json({ error: "Database unavailable" });
    await db.update(hosts).set({ status: parsed.data.status, lastHeartbeatAt: new Date() }).where(eq(hosts.id, parsed.data.hostId));
    return res.json({ accepted: true });
  });
}
