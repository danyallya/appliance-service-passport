# Security and data policy

- Collect the minimum data; treat user content as private by default.
- No authentication, authorization, encryption-at-rest or production backup policy exists yet. Do not enter real sensitive data.
- Keep secrets in untracked .env; never expose DB/provider keys to browsers.
- Never cache APIs, authenticated pages or personal records in the service worker.
- Define export, deletion, retention, access logs and incident response before launch.
- Domain guardrail: Publish only owner-approved data; verify manual and part sources.
- Review threat model, roles and offline-device recovery before launch.

## Local maintenance-history retention

The first service-history slice stores a device label, optional manufacturer/model/provider, event description and user-provided source metadata in browser IndexedDB. It does not collect serial numbers, upload receipts, fetch source URLs or publish QR codes. The source check and owner-approval checkbox are attestations: the app does not identify the device owner or independently confirm the source or workmanship. Approval is recorded separately and does not publish or sync the entry. Events remain until deleted or browser site data is cleared; there is no encryption, backup, recovery or sync. Check manufacturer/manual/part-source terms before future publication.
