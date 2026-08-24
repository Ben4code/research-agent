# Phase 13 — Scheduled Research

**Status:** ⬜ Not Started
**Milestone:** Post-MVP
**Dependencies:** Phase 7 (First E2E Workflow)

## Goals

After the MVP is stable, add recurring research.

## Example

```
Every Monday → Research competitors → Compare against previous report → Detect changes → Generate update
```

## Tasks

- [ ] Add Temporal Schedules.
- [ ] Create ResearchSchedule entity.
- [ ] Add schedule management API.
- [ ] Add schedule UI.
- [ ] Compare historical findings.
- [ ] Add change detection.
- [ ] Add notifications.

## Notes

- Temporal Schedules are a first-class feature for recurring workflows
- Need a new `ResearchSchedule` table in Prisma schema
- Change detection: diff findings between runs, highlight what's new/changed
- Notifications: email or Slack integration
- This is explicitly post-MVP — do not build until core workflow is stable
