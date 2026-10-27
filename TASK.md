# Active task

**ID:** PASSPORT-001  
**Title:** Record one verified maintenance event in a device passport.

## Context

The technical shell exists; the product workflow does not. Build the first safe, end-to-end domain slice for Appliance Service Passport.

## Acceptance criteria

- Type the devices domain record, validation rules and lifecycle.
- Add a create/review flow that works without a server round-trip.
- Persist a draft with Dexie and show saved, unsaved and sync state truthfully.
- Test valid/invalid input, date/order boundaries and serialization.
- Document retention, deletion and limitations of the offline slice.
- Respect this guardrail: Publish only owner-approved data; verify manual and part sources.

## Status

Completed locally on 2026-10-27 in `device/day-001-passport-001-service-event`. The source-attested maintenance event flow, Dexie draft/event storage, source and date validation, private/approval-recorded state, deletion and domain tests are implemented. `npm run verify` passes. Manual screen-reader and offline browser acceptance remain for PASSPORT-007/PASSPORT-008.

**Next:** PASSPORT-002 — Validate devices and add empty/error/deletion states. This slice includes baseline validation, empty state and deletion; the next task covers the broader state and recovery behavior.
