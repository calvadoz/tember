# 06. Implementation plan

[View visual brief](visuals/06-implementation-plan.svg)

## Delivery plan

This plan is intentionally scoped to the unapproved Polish and reliability iteration. It preserves the completed feature set and is ready to start only when that iteration is approved.

| Phase | Outcome and tasks | Links | Validation and milestone |
| --- | --- | --- | --- |
| 0. Release policy decisions | Confirm production host, data retention/deletion, account recovery authority, support contact, and approved monitoring. Convert decisions into product copy and contributor documentation. | PR-5, PR-6, TR security | Policy owners sign off. No account-management UI is implemented until authority is decided. |
| 1. Reliability audit | Map every local mutation, pending-sync transition, merge, import replacement, and deletion. Add focused tests for offline save, retry, tombstone precedence, and malformed remote/import data. | PR-2, PR-5, PR-6; data contract | Unit coverage demonstrates no lost local mutation and no invalid persisted snapshot. |
| 2. Accessible state polish | Review loading, empty, validation, sync, import, and destructive-confirmation messages. Centralize changed copy in messages; ensure focus, live status, and semantic labels work. | PR-1 to PR-7; design brief | Keyboard checks and automated accessibility scan pass for core journeys. |
| 3. Responsive density polish | Review Pets, journal, forms, account, and Data at required viewports. Fix document overflow, chart/row readability, and contained table scrolling; update the viewport tour for new overlays or states. | PR-3, PR-7 | Playwright viewport checks cover 320/390/430/640/768px without horizontal document overflow. |
| 4. Sync security hardening | Subject to Phase 0 policy, add proportionate abuse controls, safe operational logging, session-expiry cleanup, and generic public auth failures. Verify no Turso configuration or payload leaks in client responses/logs. | PR-6; TR security | Route tests verify auth boundaries; a configuration and deployment review passes. |
| 5. Release rehearsal | Validate JSON export/import restore, CSV export, local-only mode, account setup/sign-in, background pull, failed sync recovery, and a production-like deployment. Update `docs/changelog.md`, relevant guides, and this blueprint for material choices. | All requirements | Release candidate passes quality gates and a named owner accepts rollback/support plan. |

## Dependencies and risks

Phase 0 blocks any account-recovery, retention, or public-support commitments. Phases 1–3 can proceed independently once the iteration is approved. Phase 4 depends on choosing a deployment/monitoring approach and must avoid capturing sensitive data. Portrait data URLs can make payloads large, so test realistic backups and dense journals. Last-write-wins can surprise two people editing the same item, so status copy should set expectations without overstating certainty.

## Definition of done

- Product behaviour meets PR-1 through PR-7 and does not add excluded medical, billing, or cloud-only features.
- The data rules remain invariant: grams and millimetres in storage, required positive weight, independent optional dimensions, ISO dates/timestamps, local UUIDs.
- Authentication keeps credentials and Turso secrets server-only; unauthenticated routes do not return household data.
- Existing and new tests pass via `pnpm lint`, `pnpm typecheck`, and `pnpm test`; relevant Playwright checks pass when a server is explicitly available.
- Every changed user-visible string is localized through the existing message structure, affected docs and the changelog are updated, and no screen widens the document at required viewport widths.
- A person can restore a tested JSON backup, understand sync status, and retain usable local data through a remote outage.

## Deployment and rollback

Deploy only with required Turso variables in the server environment, HTTPS, and verified secure production cookies. Take and test a disposable export/restore fixture before migration work. If a release harms remote sync, roll back server code and pause new writes if necessary; do not clear IndexedDB or tombstones as a recovery shortcut. The local cache and user-created JSON backups are the recovery path while the incident is resolved.
