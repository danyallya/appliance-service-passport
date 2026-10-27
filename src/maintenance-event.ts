export type MaintenanceDraft = {
  deviceName: string;
  manufacturer: string;
  model: string;
  serviceDate: string;
  serviceType: string;
  summary: string;
  serviceProvider: string;
  sourceType: 'owner-log' | 'service-receipt' | 'official-manual' | 'other';
  sourceName: string;
  sourceUrl: string;
  sourceVerified: boolean;
  ownerApproved: boolean;
};

export type MaintenanceEvent = MaintenanceDraft & {
  id: string;
  createdAt: number;
  updatedAt: number;
  sourceCheckedAt: string;
  verificationState: 'owner-verified';
  sharingState: 'private' | 'approval-recorded';
  syncState: 'local-only';
};

export const EMPTY_MAINTENANCE_DRAFT: MaintenanceDraft = {
  deviceName: '',
  manufacturer: '',
  model: '',
  serviceDate: '',
  serviceType: '',
  summary: '',
  serviceProvider: '',
  sourceType: 'owner-log',
  sourceName: '',
  sourceUrl: '',
  sourceVerified: false,
  ownerApproved: false,
};

export type MaintenanceDraftErrors = Partial<Record<keyof MaintenanceDraft, string>>;

function dateValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? timestamp
    : null;
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateMaintenanceDraft(draft: MaintenanceDraft, today = new Date().toISOString().slice(0, 10)): MaintenanceDraftErrors {
  const errors: MaintenanceDraftErrors = {};
  const deviceName = draft.deviceName.trim();
  const serviceType = draft.serviceType.trim();
  const summary = draft.summary.trim();
  const sourceName = draft.sourceName.trim();

  if (!deviceName) errors.deviceName = 'Enter a device name or local label.';
  else if (deviceName.length > 100) errors.deviceName = 'Use 100 characters or fewer.';
  if (draft.manufacturer.trim().length > 100) errors.manufacturer = 'Use 100 characters or fewer.';
  if (draft.model.trim().length > 100) errors.model = 'Use 100 characters or fewer.';
  if (!draft.serviceDate || dateValue(draft.serviceDate) === null) errors.serviceDate = 'Enter a valid service date.';
  else if (dateValue(today) !== null && dateValue(draft.serviceDate)! > dateValue(today)!) errors.serviceDate = 'Service date cannot be in the future.';
  if (!serviceType) errors.serviceType = 'Choose a service type.';
  if (!summary) errors.summary = 'Describe the maintenance performed.';
  else if (summary.length > 400) errors.summary = 'Use 400 characters or fewer.';
  if (draft.serviceProvider.trim().length > 120) errors.serviceProvider = 'Use 120 characters or fewer.';
  if (!sourceName) errors.sourceName = 'Name the source you checked.';
  else if (sourceName.length > 160) errors.sourceName = 'Use 160 characters or fewer.';
  if (draft.sourceUrl.trim() && !isHttpsUrl(draft.sourceUrl.trim())) errors.sourceUrl = 'Use a valid HTTPS source URL without embedded credentials.';
  if (!draft.sourceVerified) errors.sourceVerified = 'Confirm that you checked the source and it supports this event.';
  return errors;
}

export function createMaintenanceEvent(draft: MaintenanceDraft, id: string, now: number): MaintenanceEvent {
  return {
    id,
    deviceName: draft.deviceName.trim(),
    manufacturer: draft.manufacturer.trim(),
    model: draft.model.trim(),
    serviceDate: draft.serviceDate,
    serviceType: draft.serviceType.trim(),
    summary: draft.summary.trim(),
    serviceProvider: draft.serviceProvider.trim(),
    sourceType: draft.sourceType,
    sourceName: draft.sourceName.trim(),
    sourceUrl: draft.sourceUrl.trim(),
    sourceVerified: draft.sourceVerified,
    ownerApproved: draft.ownerApproved,
    createdAt: now,
    updatedAt: now,
    sourceCheckedAt: new Date(now).toISOString(),
    verificationState: 'owner-verified',
    sharingState: draft.ownerApproved ? 'approval-recorded' : 'private',
    syncState: 'local-only',
  };
}
