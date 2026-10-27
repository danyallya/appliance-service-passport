import { describe, expect, it } from 'vitest';
import {
  createMaintenanceEvent,
  EMPTY_MAINTENANCE_DRAFT,
  validateMaintenanceDraft,
  type MaintenanceDraft,
} from './maintenance-event';

const validDraft: MaintenanceDraft = {
  deviceName: 'Kitchen refrigerator',
  manufacturer: 'Northstar',
  model: 'FR-200',
  serviceDate: '2026-10-27',
  serviceType: 'Repair',
  summary: 'Replaced the water inlet filter.',
  serviceProvider: 'Local repair shop',
  sourceType: 'service-receipt',
  sourceName: 'Owner-held service receipt',
  sourceUrl: '',
  sourceVerified: true,
  ownerApproved: false,
};

describe('maintenance event rules', () => {
  it('requires a device, service description, source and owner source check', () => {
    expect(validateMaintenanceDraft(EMPTY_MAINTENANCE_DRAFT, '2026-10-27')).toMatchObject({
      deviceName: 'Enter a device name or local label.',
      serviceDate: 'Enter a valid service date.',
      serviceType: 'Choose a service type.',
      summary: 'Describe the maintenance performed.',
      sourceName: 'Name the source you checked.',
      sourceVerified: 'Confirm that you checked the source and it supports this event.',
    });
  });

  it('accepts today and rejects future or impossible service dates', () => {
    expect(validateMaintenanceDraft(validDraft, '2026-10-27')).toEqual({});
    expect(validateMaintenanceDraft({ ...validDraft, serviceDate: '2026-10-28' }, '2026-10-27')).toMatchObject({
      serviceDate: 'Service date cannot be in the future.',
    });
    expect(validateMaintenanceDraft({ ...validDraft, serviceDate: '2026-02-30' }, '2026-10-27')).toMatchObject({
      serviceDate: 'Enter a valid service date.',
    });
  });

  it('requires HTTPS for a provided source link and rejects embedded credentials', () => {
    expect(validateMaintenanceDraft({ ...validDraft, sourceUrl: 'http://manual.example.com' }, '2026-10-27')).toMatchObject({
      sourceUrl: 'Use a valid HTTPS source URL without embedded credentials.',
    });
    expect(validateMaintenanceDraft({ ...validDraft, sourceUrl: 'https://user:secret@example.com/manual' }, '2026-10-27')).toMatchObject({
      sourceUrl: 'Use a valid HTTPS source URL without embedded credentials.',
    });
  });

  it('serializes source-check and sharing state truthfully', () => {
    const event = createMaintenanceEvent({ ...validDraft, deviceName: ' Fridge ', ownerApproved: true }, 'event-1', 1234);
    expect(JSON.parse(JSON.stringify(event))).toEqual({
      id: 'event-1',
      deviceName: 'Fridge',
      manufacturer: 'Northstar',
      model: 'FR-200',
      serviceDate: '2026-10-27',
      serviceType: 'Repair',
      summary: 'Replaced the water inlet filter.',
      serviceProvider: 'Local repair shop',
      sourceType: 'service-receipt',
      sourceName: 'Owner-held service receipt',
      sourceUrl: '',
      sourceVerified: true,
      ownerApproved: true,
      createdAt: 1234,
      updatedAt: 1234,
      sourceCheckedAt: '1970-01-01T00:00:01.234Z',
      verificationState: 'owner-verified',
      sharingState: 'approval-recorded',
      syncState: 'local-only',
    });
  });
});
