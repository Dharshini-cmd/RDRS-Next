export type RiskEvent = {
  eventType: "create" | "modify" | "rename" | "delete";
  oldExtension?: string | null;
  newExtension?: string | null;
  isProtectedPath?: boolean;
};

export type RiskSignal = {
  signal: string;
  contribution: number;
  details: string;
};

export function scoreActivity(events: RiskEvent[], protectedImpactWeight = 25) {
  const signals: RiskSignal[] = [];
  const modifies = events.filter(event => event.eventType === "modify").length;
  const renames = events.filter(event => event.eventType === "rename").length;
  const deletes = events.filter(event => event.eventType === "delete").length;
  const extensionChanges = events.filter(event => event.oldExtension && event.newExtension && event.oldExtension !== event.newExtension).length;
  const protectedEvents = events.filter(event => event.isProtectedPath).length;

  if (modifies >= 12) signals.push({ signal: "modification_burst", contribution: 35, details: `${modifies} modifications observed in the rolling window.` });
  else if (modifies >= 5) signals.push({ signal: "elevated_modifications", contribution: 15, details: `${modifies} modifications observed in the rolling window.` });
  if (extensionChanges >= 3) signals.push({ signal: "extension_changes", contribution: 25, details: `${extensionChanges} files changed extension.` });
  if (renames >= 5) signals.push({ signal: "bulk_renames", contribution: 25, details: `${renames} rename operations observed.` });
  if (deletes >= 5) signals.push({ signal: "delete_burst", contribution: 15, details: `${deletes} delete operations observed.` });
  if (protectedEvents > 0) signals.push({ signal: "protected_directory_impact", contribution: protectedImpactWeight, details: `${protectedEvents} events touched a protected path.` });

  const riskScore = Math.min(100, signals.reduce((sum, signal) => sum + signal.contribution, 0));
  const severity = riskScore >= 65 ? "critical" : riskScore >= 45 ? "high" : riskScore >= 20 ? "medium" : "low";
  const explanation = signals.length ? signals.map(signal => signal.details).join(" ") : "No suspicious behavior signals crossed the configured thresholds.";
  return { riskScore, severity, signals, explanation } as const;
}
