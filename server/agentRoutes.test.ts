import { describe, expect, it, vi } from "vitest";

const fakeDb = {
  select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 1, ownerId: 7 }] }) }) }),
  insert: () => ({ values: async () => [{ insertId: 42 }] }),
  update: () => ({ set: () => ({ where: async () => undefined }) }),
};
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getDb: async () => fakeDb };
});
import { registerAgentRoutes } from "./agentRoutes";

type Handler = (req: any, res: any) => Promise<any>;
function routes() { const captured: Record<string, Handler> = {}; registerAgentRoutes({ post: (path: string, handler: Handler) => { captured[path] = handler; } } as any); return captured; }
function response() { const result: any = {}; result.status = (code: number) => { result.code = code; return result; }; result.json = (body: unknown) => { result.body = body; return result; }; return result; }
const auth = { authorization: "Bearer dev-agent-token" };

describe("agent HTTP routes", () => {
  it("rejects missing bearer credentials", async () => { const res = response(); await routes()["/api/telemetry/heartbeat"]({ headers: {}, body: { hostId: 1, status: "online" } }, res); expect(res.code).toBe(401); });
  it("rejects malformed telemetry with valid development credentials", async () => { const res = response(); await routes()["/api/telemetry/ingest"]({ headers: auth, body: { hostId: 1 } }, res); expect(res.code).toBe(400); });
  it("accepts a valid agent event", async () => { const res = response(); await routes()["/api/telemetry/ingest"]({ headers: auth, body: { hostId: 1, profileId: 1, source: "agent", correlationId: "agent-test", eventType: "modify", filePath: "/authorized/test-folder/a.txt", isProtectedPath: false, occurredAt: new Date().toISOString() } }, res); expect(res.body).toEqual({ accepted: true, eventId: 42 }); });
  it("accepts a valid heartbeat", async () => { const res = response(); await routes()["/api/telemetry/heartbeat"]({ headers: auth, body: { hostId: 1, status: "online" } }, res); expect(res.body).toEqual({ accepted: true }); });
});
