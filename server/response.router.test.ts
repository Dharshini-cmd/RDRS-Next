import { describe, expect, it, vi } from "vitest";

const incident = { id: 1, ownerId: 7, status: "open", assignedTo: null };
const writes: string[] = [];
const fakeDb = {
  select: () => ({ from: () => ({ where: async () => [incident] }) }),
  update: () => ({ set: (values: any) => ({ where: async () => { writes.push(`update:${values.status}`); } }) }),
  insert: () => ({ values: async (values: any) => { writes.push(`insert:${values.action || "event"}`); return [{ insertId: 1 }]; } }),
};
vi.mock("./db", async () => { const actual = await vi.importActual<typeof import("./db")>("./db"); return { ...actual, getDb: async () => fakeDb }; });
import { appRouter } from "./routers";

describe("response and telemetry authorization", () => {
  const ctx: any = { user: { id: 7, role: "user", openId: "user-7" }, req: {}, res: {} };
  it("blocks telemetry ingestion for non-admin users before database access", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.telemetry.ingest({ hostId: 1, profileId: 1, source: "agent", correlationId: "agent-test", eventType: "modify", filePath: "/authorized/test-folder/a.txt", isProtectedPath: false, occurredAt: new Date() })).rejects.toThrow("Administrator access required");
  });
  it("rejects unsupported incident status values at the router boundary", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.response.updateIncident({ incidentId: 1, status: "invalid" as any })).rejects.toThrow();
  });
  it("updates an owned incident and records response plus audit writes", async () => {
    writes.length = 0;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.response.updateIncident({ incidentId: 1, status: "acknowledged", note: "Reviewed evidence" })).resolves.toEqual({ success: true });
    expect(writes).toEqual(expect.arrayContaining(["update:acknowledged", "insert:acknowledged", "insert:acknowledged"]));
  });
});
