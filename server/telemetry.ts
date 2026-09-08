export function isSimulationSource(source: "agent" | "simulation") {
  return source === "simulation";
}

export function canTransitionIncident(status: string) {
  return ["acknowledged", "assigned", "escalated", "resolved", "false_positive"].includes(status);
}

export function canUseAdminTelemetry(role: "user" | "admin") {
  return role === "admin";
}
