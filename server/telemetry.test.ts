import { describe, expect, it } from "vitest";
import { canTransitionIncident, canUseAdminTelemetry, isSimulationSource } from "./telemetry";

describe("telemetry policies", () => {
  it("distinguishes simulated records from agent records", () => {
    expect(isSimulationSource("simulation")).toBe(true);
    expect(isSimulationSource("agent")).toBe(false);
  });
  it("allows only supported incident transitions", () => {
    expect(canTransitionIncident("acknowledged")).toBe(true);
    expect(canTransitionIncident("resolved")).toBe(true);
    expect(canTransitionIncident("unknown")).toBe(false);
  });
  it("requires administrator role for telemetry ingestion", () => {
    expect(canUseAdminTelemetry("admin")).toBe(true);
    expect(canUseAdminTelemetry("user")).toBe(false);
  });
});
