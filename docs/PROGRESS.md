# Progress log

## 2026-10-27 — foundation

**Done:** localized Next/TypeScript/Tailwind/React Icons/PostgreSQL/Docker/PWA shell, Dexie/outbox starter, health route, metadata test, CI, product brief, task/backlog and operations/security notes.

**Not done:** product workflow, auth, domain tables, sync, release security review, provider, dependency install and lockfile.

**Next:** Record one verified maintenance event in a device passport.

**Delivery:** Public repository created and foundation pushed to main. The latest handoff is committed locally; push it when the cache/Docker blocker is cleared.


## Environment check — 2026-10-27

**Update:** Compose now passes PostgreSQL host, database, user and password as separate environment fields so local password characters do not break a connection URL. docker compose config --quiet passes for all 30 projects; runtime verification is pending Docker access.

Docker service com.docker.service is stopped; Start-Service cannot open it with current permissions. The npm cache registry at localhost:4873 is unavailable. Offline lockfile generation returned ETARGET for eslint-config-next@16.4.3 from the host cache. No dependency install, tests or production build ran; CI reports a warning and skips dependency installation, tests, lint and build until a lockfile is committed.

## 2026-10-27 — PASSPORT-001: owner-checked maintenance event

**Done:** Added a typed local maintenance-event model, date and field validation, HTTPS source-URL validation, required entrant source-check attestation, and a separate approval-recorded state. Added Dexie v2 event/draft tables, debounced draft persistence, a review-before-save flow, transactional event/draft save, visible local-only state and deletion. Added unit coverage for required/invalid fields, date boundaries, HTTPS and serialization. Updated data-retention and source-verification guidance. Pinned the lockfile and Vitest 5.0.5 after audit identified the moderate advisory affecting 5.0.0.

**Checks:** Docker Engine and Offline Dev Vault registry/manager were healthy. `npm ci --registry=http://localhost:4873/ --prefer-offline` completed (403 packages; 0 audit vulnerabilities). Final `npm run verify` passed: typecheck, 2 test files / 5 tests, lint and Next production build. Lint retained one pre-existing warning in `postcss.config.mjs`; Vitest printed a Vite config-loader warning. Initial typecheck found an impossible locale comparison in `src/project-info.test.ts`; it was corrected and the full verification then passed.

**Not run:** Manual browser/offline, keyboard and screen-reader acceptance; the app does not contact a provider, database or source URL in this slice.

**Review and delivery:** Start-of-day triage found no open Issues and six open PRs. PR #6 (preparation handoff) had successful CI and no comments/reviews. PRs #1–#5 were open with failing `verify` checks; the failed step was `actions/setup-node@v4`, while `npm ci` and `npm run verify` were skipped. The Vitest PR #4 proposes the version now pinned here. Branch `device/day-001-passport-001-service-event` was pushed and [PR #7](https://github.com/danyallya/appliance-service-passport/pull/7) opened against PR #6; GitHub verification is in progress. Exact final SHA and self-review are recorded in the central governance evidence and day ledger.

**Next:** Continue PASSPORT-002 after reviewing the preparation and dependency PRs; inspect the `setup-node` failure before relying on the older remote CI results.
