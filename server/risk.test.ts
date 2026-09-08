import { describe, expect, it } from "vitest";
import { scoreActivity } from "./risk";

const event = (eventType: "create" | "modify" | "rename" | "delete", extra = {}) => ({ eventType, ...extra });

describe("scoreActivity", () => {
  it("keeps ordinary editing low risk", () => {
    const result = scoreActivity([event("modify"), event("modify"), event("create")]);
    expect(result.riskScore).toBe(0);
    expect(result.severity).toBe("low");
    expect(result.explanation).toContain("No suspicious");
  });

  it("explains extension changes and bulk renames", () => {
    const result = scoreActivity([
      event("rename", { oldExtension: ".docx", newExtension: ".locked" }),
      event("rename", { oldExtension: ".pdf", newExtension: ".locked" }),
      event("rename", { oldExtension: ".jpg", newExtension: ".locked" }),
      event("rename"), event("rename"), event("rename"),
    ]);
    expect(result.riskScore).toBeGreaterThanOrEqual(50);
    expect(result.signals.map(signal => signal.signal)).toEqual(expect.arrayContaining(["extension_changes", "bulk_renames"]));
  });

  it("raises critical risk for a protected-path burst", () => {
    const events = Array.from({ length: 18 }, () => event("modify", { isProtectedPath: true }));
    const result = scoreActivity(events, 30);
    expect(result.severity).toBe("critical");
    expect(result.riskScore).toBe(65);
    expect(result.signals.map(signal => signal.signal)).toContain("protected_directory_impact");
  });
});
