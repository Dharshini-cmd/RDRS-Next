
# Project TODO

- [x] Build the Python local monitoring agent for explicitly configured test folders only
- [x] Normalize create, modify, rename, and delete activity events
- [x] Add agent heartbeats and bounded buffering/retry during short connection failures
- [x] Implement explainable rolling-window rules-based detection and severity scoring
- [x] Persist hosts, monitored profiles, activity events, incidents, evidence, response actions, reports, and audit history
- [x] Add typed, authenticated, role-gated APIs for telemetry, dashboard, controls, and exports
- [x] Build polished Overview, Live Activity, Incidents, Incident Detail, Monitored Profiles, and Reports views
- [x] Build clearly labeled Simulation Lab with benign editing, backup-like, bulk-rename, and ransomware-like safe presets
- [x] Ensure simulation telemetry is always distinct from agent telemetry in schema, API, and UI
- [x] Add acknowledge, assign, escalate, resolve, and false-positive incident workflows with operator notes
- [x] Add immutable response-action audit history
- [x] Add safe agent pause/resume and monitored-profile disablement controls
- [x] Restrict quarantine to confirmed, explicitly selected test artifacts in the designated quarantine directory
- [x] Add JSON and Markdown/CSV incident exports
- [x] Add setup documentation and a safe end-to-end demonstration script
- [x] Add automated tests for event handling, scoring, incident status changes, simulation labeling, and authorization
- [x] Validate responsive accessibility and elegant analyst-console visual design

## Change history

- [x] 2026-09-01: Expand the approved plan with the complete feature specification and strict test-folder, simulation-labeling, and quarantine safety constraints

## Follow-up gaps identified during validation

- [x] Implement real HTTP agent endpoints or adapt the agent to the existing typed API for end-to-end ingestion and heartbeats
- [x] Add an Incident Detail view with evidence timeline, actions, notes, and status controls
- [x] Wire analyst UI controls for all incident status transitions and operator notes
- [x] Implement or explicitly scope the dashboard-to-agent pause/resume control path
- [x] Add confirmed quarantine UI/API flow for explicitly selected test artifacts only
- [x] Add tests for telemetry ingestion, incident transitions, simulation labeling, and role authorization
- [x] Run responsive/mobile and accessibility verification beyond the desktop screenshot

## Final validation corrections

- [x] Clarify in the dashboard that Pause monitoring disables the profile, while endpoint pause/resume remains local-agent-only
- [x] Add a confirmed, explicitly selected test-artifact quarantine workflow with audit entry
- [x] Add integration-style tests for telemetry HTTP authorization and incident transition authorization
- [x] Document broader responsive and accessibility verification across key views

## Evidence-quality corrections

- [x] Implement analyst-driven selection of a real test artifact for quarantine rather than deriving a fixed placeholder path
- [x] Add integration tests for HTTP telemetry authorization and successful ingestion/heartbeat behavior
- [x] Add router tests for incident update authorization, status changes, and audit/action creation
- [x] Write a verification note covering responsive views, keyboard navigation, focus visibility, and reduced-motion behavior

## Final test evidence gaps

- [x] Add Vitest route tests for unauthorized, invalid, and accepted telemetry HTTP requests
- [x] Add router tests for incident status updates, authorization, response-action creation, and audit-log creation
