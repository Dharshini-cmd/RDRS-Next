# RDRS Next

RDRS Next is a defensive ransomware-observability prototype designed for **authorized security testing environments**.

It combines:

- A browser-based security operations dashboard
- A clearly labeled telemetry simulation lab
- A local Python endpoint agent
- Explainable risk scoring
- Incident investigation and response tracking
- Evidence and action history
- Audit logging
- Controlled test-artifact quarantine requests
- MySQL database persistence through Drizzle ORM

RDRS is intended for experimentation, demonstrations, development, and controlled security testing. It is **not a production endpoint detection and response (EDR) platform**.

---

## Overview

RDRS monitors activity within explicitly configured test environments and converts normalized file events into risk signals.

The dashboard provides visibility into:

- Current monitoring posture
- Recent file activity
- Active incidents
- Risk scores
- Incident evidence
- Operator actions
- Monitoring profiles
- Audit history
- Report generation
- Synthetic security scenarios

The project uses the same normalized event model for both simulated telemetry and the local endpoint agent.

Simulation events are explicitly labeled as:

```text
source = simulation