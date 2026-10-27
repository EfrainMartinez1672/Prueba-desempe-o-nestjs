import { describe, expect, it } from 'vitest';
import { WorkshopStatus } from '../entities/workshop-status.enum.js';
import { CreateWorkshopSchema } from './create-workshop.dto.js';
import { UpdateWorkshopStatusSchema } from './update-workshop-status.dto.js';

describe('Workshop DTO schemas', () => {
  it('trims workshop fields and defaults the status to active', () => {
    expect(CreateWorkshopSchema.parse({ name: ' Central Workshop ', address: ' 123 Main Street ' })).toEqual({
      name: 'Central Workshop',
      address: '123 Main Street',
      status: WorkshopStatus.ACTIVE,
    });
  });

  it('validates required fields and activation status', () => {
    expect(CreateWorkshopSchema.safeParse({ name: '', address: '123 Main Street' }).success).toBe(false);
    expect(UpdateWorkshopStatusSchema.safeParse({ status: 'CLOSED' }).success).toBe(false);
    expect(UpdateWorkshopStatusSchema.safeParse({ status: WorkshopStatus.INACTIVE }).success).toBe(true);
  });
});
