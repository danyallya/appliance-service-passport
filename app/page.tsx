'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuBookOpenCheck, LuShieldCheck, LuTrash2, LuWifiOff, LuWrench } from 'react-icons/lu';
import { localDatabase } from '@/client-db';
import {
  createMaintenanceEvent,
  EMPTY_MAINTENANCE_DRAFT,
  validateMaintenanceDraft,
  type MaintenanceDraft,
  type MaintenanceDraftErrors,
  type MaintenanceEvent,
} from '@/maintenance-event';
import { projectInfo } from '@/project-info';

const serviceTypes = ['Inspection', 'Routine service', 'Repair', 'Part replacement', 'Other'];
const sourceTypes: Record<MaintenanceDraft['sourceType'], string> = {
  'owner-log': 'Owner maintenance log',
  'service-receipt': 'Service receipt',
  'official-manual': 'Official manual',
  other: 'Other checked source',
};

function formatDate(value: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat(projectInfo.locale, { dateStyle: 'medium', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00.000Z`));
}

export default function HomePage() {
  const [draft, setDraft] = useState<MaintenanceDraft>(EMPTY_MAINTENANCE_DRAFT);
  const [events, setEvents] = useState<MaintenanceEvent[]>([]);
  const [ready, setReady] = useState(false);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [hasInteracted, setHasInteracted] = useState(false);
  const [draftState, setDraftState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle');
  const [storageError, setStorageError] = useState('');
  const [message, setMessage] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([localDatabase.maintenanceEvents.toArray(), localDatabase.maintenanceDrafts.get('current')])
      .then(([savedEvents, savedDraft]) => {
        if (!active) return;
        setEvents(savedEvents.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate)));
        if (savedDraft) {
          setDraft(savedDraft.draft);
          setHasInteracted(true);
          setDraftState('saved');
        }
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setStorageError('This browser could not open local storage. Your entries have not been saved.');
        setReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready || !hasInteracted || storageError) return;
    const timeout = window.setTimeout(() => {
      setDraftState('saving');
      void localDatabase.maintenanceDrafts.put({ id: 'current', draft, updatedAt: Date.now() })
        .then(() => setDraftState('saved'))
        .catch(() => {
          setDraftState('error');
          setStorageError('The draft could not be saved on this device.');
        });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [draft, hasInteracted, ready, storageError]);

  const errors = useMemo<MaintenanceDraftErrors>(() => validateMaintenanceDraft(draft, today), [draft, today]);
  const valid = Object.keys(errors).length === 0;

  function updateDraft(field: keyof MaintenanceDraft, value: string | boolean) {
    setDraft(current => ({ ...current, [field]: value }));
    setHasInteracted(true);
    setDraftState('unsaved');
    setMessage('');
  }

  async function saveEvent() {
    setReviewOpen(true);
    if (!valid) {
      setMessage('Fix the highlighted fields before saving this event.');
      return;
    }
    setBusy(true);
    setStorageError('');
    try {
      const now = Date.now();
      const event = createMaintenanceEvent(draft, crypto.randomUUID(), now);
      const savedEvents = await localDatabase.transaction('rw', localDatabase.maintenanceEvents, localDatabase.maintenanceDrafts, async () => {
        await localDatabase.maintenanceEvents.add(event);
        await localDatabase.maintenanceDrafts.delete('current');
        return localDatabase.maintenanceEvents.toArray();
      });
      setEvents(savedEvents.sort((a, b) => b.serviceDate.localeCompare(a.serviceDate)));
      setDraft(EMPTY_MAINTENANCE_DRAFT);
      setHasInteracted(false);
      setDraftState('idle');
      setReviewOpen(false);
      setMessage('Maintenance event saved on this device. Server sync is not available yet.');
    } catch {
      setStorageError('The event could not be saved. Your draft is still available; try again.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent(event: MaintenanceEvent) {
    if (!window.confirm(`Delete the ${event.serviceType.toLowerCase()} event for “${event.deviceName}” from this device? This cannot be undone.`)) return;
    try {
      await localDatabase.maintenanceEvents.delete(event.id);
      setEvents(current => current.filter(item => item.id !== event.id));
      setMessage('Maintenance event deleted from this device.');
    } catch {
      setStorageError('The event could not be deleted.');
    }
  }

  async function clearDraft() {
    if (!window.confirm('Clear the saved maintenance draft from this device?')) return;
    try {
      await localDatabase.maintenanceDrafts.delete('current');
      setDraft(EMPTY_MAINTENANCE_DRAFT);
      setHasInteracted(false);
      setDraftState('idle');
      setReviewOpen(false);
      setMessage('Saved draft cleared from this device.');
    } catch {
      setStorageError('The saved draft could not be cleared.');
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <a className="font-semibold text-sky-900" href="https://github.com/danyallya/appliance-service-passport">{projectInfo.title}</a>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-900">Local service passport</span>
        </header>

        <section className="py-8 sm:py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-sky-800">Device history · one checked event at a time</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-5xl">Keep service history with the device</h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">Record what was done, when it happened and which source you checked. Entries remain private and local until an owner explicitly approves future sharing.</p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <article className="flex gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4" role="note">
              <LuShieldCheck className="mt-0.5 shrink-0 text-emerald-800" aria-hidden="true" />
              <div><h2 className="font-semibold text-emerald-950">Source check recorded</h2><p className="mt-1 text-sm leading-6 text-emerald-950">The app records your statement; it does not identify the device owner or independently verify manuals, parts or service providers.</p></div>
            </article>
            <article className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4" role="note">
              <LuWifiOff className="mt-0.5 shrink-0 text-slate-600" aria-hidden="true" />
              <div><h2 className="font-semibold">Local only</h2><p className="mt-1 text-sm leading-6 text-slate-600">No public QR, sync, backup, recovery or service-provider lookup is available yet.</p></div>
            </article>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3">
              <LuWrench className="mt-1 text-sky-800" aria-hidden="true" />
              <div><h2 className="text-xl font-semibold">Record a maintenance event</h2><p className="mt-1 text-sm text-slate-600">Use a local device label; do not enter serial numbers or private owner details.</p></div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={event => { event.preventDefault(); void saveEvent(); }}>
              <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold">Device</legend>
                <div>
                  <label className="block text-sm font-medium" htmlFor="device-name">Device label <span aria-hidden="true">*</span></label>
                  <input id="device-name" value={draft.deviceName} onChange={event => updateDraft('deviceName', event.target.value)} maxLength={100} required aria-invalid={Boolean(errors.deviceName)} aria-describedby={errors.deviceName ? 'device-name-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="For example, kitchen refrigerator" />
                  {errors.deviceName && <p className="mt-1 text-sm text-rose-700" id="device-name-error">{errors.deviceName}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="block text-sm font-medium" htmlFor="manufacturer">Manufacturer <span className="font-normal text-slate-500">(optional)</span></label><input id="manufacturer" value={draft.manufacturer} onChange={event => updateDraft('manufacturer', event.target.value)} maxLength={100} aria-invalid={Boolean(errors.manufacturer)} aria-describedby={errors.manufacturer ? 'manufacturer-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />{errors.manufacturer && <p className="mt-1 text-sm text-rose-700" id="manufacturer-error">{errors.manufacturer}</p>}</div>
                  <div><label className="block text-sm font-medium" htmlFor="model">Model <span className="font-normal text-slate-500">(optional)</span></label><input id="model" value={draft.model} onChange={event => updateDraft('model', event.target.value)} maxLength={100} aria-invalid={Boolean(errors.model)} aria-describedby={errors.model ? 'model-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />{errors.model && <p className="mt-1 text-sm text-rose-700" id="model-error">{errors.model}</p>}</div>
                </div>
              </fieldset>

              <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold">Service event</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="block text-sm font-medium" htmlFor="service-date">Service date <span aria-hidden="true">*</span></label><input id="service-date" type="date" value={draft.serviceDate} onChange={event => updateDraft('serviceDate', event.target.value)} required aria-invalid={Boolean(errors.serviceDate)} aria-describedby={errors.serviceDate ? 'service-date-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />{errors.serviceDate && <p className="mt-1 text-sm text-rose-700" id="service-date-error">{errors.serviceDate}</p>}</div>
                  <div><label className="block text-sm font-medium" htmlFor="service-type">Service type <span aria-hidden="true">*</span></label><select id="service-type" value={draft.serviceType} onChange={event => updateDraft('serviceType', event.target.value)} required aria-invalid={Boolean(errors.serviceType)} aria-describedby={errors.serviceType ? 'service-type-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"><option value="">Choose a type</option>{serviceTypes.map(type => <option key={type} value={type}>{type}</option>)}</select>{errors.serviceType && <p className="mt-1 text-sm text-rose-700" id="service-type-error">{errors.serviceType}</p>}</div>
                </div>
                <div><label className="block text-sm font-medium" htmlFor="summary">Work performed <span aria-hidden="true">*</span></label><textarea id="summary" value={draft.summary} onChange={event => updateDraft('summary', event.target.value)} maxLength={400} rows={3} required aria-invalid={Boolean(errors.summary)} aria-describedby={errors.summary ? 'summary-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="Describe the maintenance without private owner details." />{errors.summary && <p className="mt-1 text-sm text-rose-700" id="summary-error">{errors.summary}</p>}</div>
                <div><label className="block text-sm font-medium" htmlFor="provider">Service provider <span className="font-normal text-slate-500">(optional)</span></label><input id="provider" value={draft.serviceProvider} onChange={event => updateDraft('serviceProvider', event.target.value)} maxLength={120} aria-invalid={Boolean(errors.serviceProvider)} aria-describedby={errors.serviceProvider ? 'provider-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" />{errors.serviceProvider && <p className="mt-1 text-sm text-rose-700" id="provider-error">{errors.serviceProvider}</p>}</div>
              </fieldset>

              <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold">Evidence and owner approval</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="block text-sm font-medium" htmlFor="source-type">Source type</label><select id="source-type" value={draft.sourceType} onChange={event => updateDraft('sourceType', event.target.value as MaintenanceDraft['sourceType'])} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200">{Object.entries(sourceTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                  <div><label className="block text-sm font-medium" htmlFor="source-name">Source name <span aria-hidden="true">*</span></label><input id="source-name" value={draft.sourceName} onChange={event => updateDraft('sourceName', event.target.value)} maxLength={160} required aria-invalid={Boolean(errors.sourceName)} aria-describedby={errors.sourceName ? 'source-name-error' : undefined} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="For example, dated service receipt" />{errors.sourceName && <p className="mt-1 text-sm text-rose-700" id="source-name-error">{errors.sourceName}</p>}</div>
                </div>
                <div><label className="block text-sm font-medium" htmlFor="source-url">HTTPS source URL <span className="font-normal text-slate-500">(optional)</span></label><input id="source-url" type="url" inputMode="url" value={draft.sourceUrl} onChange={event => updateDraft('sourceUrl', event.target.value)} aria-invalid={Boolean(errors.sourceUrl)} aria-describedby={errors.sourceUrl ? 'source-url-error' : 'source-url-help'} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 focus:border-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200" placeholder="https://example.com/manual" />{errors.sourceUrl ? <p className="mt-1 text-sm text-rose-700" id="source-url-error">{errors.sourceUrl}</p> : <p className="mt-1 text-xs text-slate-500" id="source-url-help">Links are stored as text and are not opened or verified by this app.</p>}</div>
                <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm leading-6"><input type="checkbox" checked={draft.sourceVerified} onChange={event => updateDraft('sourceVerified', event.target.checked)} aria-required="true" aria-invalid={Boolean(errors.sourceVerified)} aria-describedby={errors.sourceVerified ? 'source-check-error' : undefined} className="mt-1 size-4 accent-sky-800" /><span>I checked this source and it supports the event I recorded. This is an attestation; the app does not verify my identity or independently verify the source.</span></label>
                {errors.sourceVerified && <p className="-mt-3 text-sm text-rose-700" id="source-check-error">{errors.sourceVerified}</p>}
                <label className="flex items-start gap-3 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm leading-6"><input type="checkbox" checked={draft.ownerApproved} onChange={event => updateDraft('ownerApproved', event.target.checked)} className="mt-1 size-4 accent-sky-800" /><span>I am the device owner or have the owner’s approval for possible future sharing. This statement is not identity-verified; saving remains local and no public QR or sharing feature exists.</span></label>
              </fieldset>

              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setReviewOpen(true); setMessage(valid ? '' : 'Review the highlighted fields before saving.'); }} disabled={!ready || Boolean(storageError)} className="rounded-lg bg-sky-800 px-4 py-2.5 font-medium text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50">Review event</button>
                {hasInteracted && <button type="button" onClick={() => void clearDraft()} className="rounded-lg px-3 py-2.5 text-sm text-slate-700 underline underline-offset-2">Clear draft</button>}
                <span className="text-sm text-slate-600" aria-live="polite">{!ready ? 'Loading this device…' : storageError ? 'Storage error' : draftState === 'saving' ? 'Saving draft…' : draftState === 'saved' ? 'Draft saved on this device' : draftState === 'unsaved' ? 'Unsaved changes' : 'Draft not started'}</span>
              </div>
            </form>

            {reviewOpen && <section className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4" aria-labelledby="review-title">
              <h3 className="font-semibold" id="review-title">Review before saving</h3>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-600">Device</dt><dd className="font-medium">{draft.deviceName.trim() || 'Not entered'}{draft.manufacturer ? ` · ${draft.manufacturer}` : ''}{draft.model ? ` · ${draft.model}` : ''}</dd></div>
                <div><dt className="text-slate-600">Service</dt><dd className="font-medium">{draft.serviceType || 'Not selected'} · {formatDate(draft.serviceDate) || 'Date not entered'}</dd></div>
                <div><dt className="text-slate-600">Source check</dt><dd className="font-medium">{draft.sourceVerified ? `Owner checked: ${draft.sourceName || 'source name missing'}` : 'Not checked'}</dd></div>
                <div><dt className="text-slate-600">Sharing</dt><dd className="font-medium">{draft.ownerApproved ? 'Approval statement recorded for possible future sharing' : 'Private; no approval statement recorded'}</dd></div>
              </dl>
              {!valid && <p className="mt-3 text-sm text-rose-800">Resolve the validation errors above before saving.</p>}
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={() => void saveEvent()} disabled={!valid || busy || !ready || Boolean(storageError) || draftState === 'unsaved' || draftState === 'saving'} className="rounded-lg bg-sky-800 px-4 py-2.5 font-medium text-white hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Saving…' : draftState === 'unsaved' || draftState === 'saving' ? 'Saving draft…' : 'Save on this device'}</button>
                <button type="button" onClick={() => setReviewOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium">Keep editing</button>
              </div>
            </section>}
            {message && <p className="mt-4 text-sm text-sky-900" role="status" aria-live="polite">{message}</p>}
            {storageError && <p className="mt-4 text-sm text-rose-800" role="alert">{storageError}</p>}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2"><LuBookOpenCheck className="text-sky-800" aria-hidden="true" /><h2 className="text-xl font-semibold">Service history</h2></div>
            <p className="mt-2 text-sm leading-6 text-slate-600">The check is attributed to the owner who entered it; this app does not independently confirm sources or workmanship.</p>
            {storageError && events.length === 0 ? <p className="mt-6 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">Local storage is unavailable, so saved events cannot be shown.</p> : events.length === 0 ? <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No service events yet. Your first checked event will appear here.</p> : <ul className="mt-5 space-y-3">
              {events.map(event => <li key={event.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="text-xs font-medium text-slate-500">{formatDate(event.serviceDate)} · {event.serviceType}</p><h3 className="mt-1 break-words font-semibold">{event.deviceName}</h3><p className="mt-1 text-sm text-slate-600">{[event.manufacturer, event.model].filter(Boolean).join(' · ') || 'Model details not entered'}</p></div>
                  <button type="button" onClick={() => void deleteEvent(event)} aria-label={`Delete ${event.serviceType} event for ${event.deviceName}`} className="rounded-md p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-300"><LuTrash2 aria-hidden="true" /></button>
                </div>
                <p className="mt-3 text-sm leading-6">{event.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-900">Source check attested</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{event.sharingState === 'approval-recorded' ? 'Approval statement recorded' : 'Private'}</span></div>
                <p className="mt-3 text-xs text-slate-600">Source: {event.sourceName} ({sourceTypes[event.sourceType]})</p>
                {event.sourceUrl && <p className="mt-1 break-all text-xs text-slate-500">{event.sourceUrl}</p>}
                {event.serviceProvider && <p className="mt-1 text-xs text-slate-500">Provider: {event.serviceProvider}</p>}
                <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">Saved locally · not synced · owner verification only</p>
              </li>)}
            </ul>}
            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">Events remain in this browser until deleted or site data is cleared. There is no backup or device recovery. Check manufacturer, manual and part-source terms before any future publication.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
