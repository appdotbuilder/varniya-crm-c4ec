
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { type UpdateLeadInput, type CreateLeadInput } from '../schema';
import { updateLead } from '../handlers/update_lead';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  name: 'Test Agent',
  email: 'agent@test.com',
  role: 'sales_agent' as const
};

const testLead: CreateLeadInput = {
  phone: '+1234567890',
  email: 'test@example.com',
  name: 'Test Lead',
  stage: 'raw_lead',
  medium: 'phone',
  source: 'google',
  high_intent: false,
  request_type: 'product_enquiry',
  urgency: '1_month',
  special_date: null,
  occasion: null,
  assigned_agent_id: null
};

describe('updateLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic lead fields', async () => {
    // Create user and lead
    const user = await db.insert(usersTable).values(testUser).returning().execute();
    const lead = await db.insert(leadsTable).values({
      ...testLead,
      assigned_agent_id: user[0].id
    }).returning().execute();

    const updateInput: UpdateLeadInput = {
      id: lead[0].id,
      name: 'Updated Lead Name',
      email: 'updated@example.com',
      stage: 'in_contact'
    };

    const result = await updateLead(updateInput);

    expect(result.id).toEqual(lead[0].id);
    expect(result.name).toEqual('Updated Lead Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.stage).toEqual('in_contact');
    expect(result.phone).toEqual(testLead.phone); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > lead[0].updated_at).toBe(true);
  });

  it('should save updates to database', async () => {
    // Create lead
    const lead = await db.insert(leadsTable).values(testLead).returning().execute();

    const updateInput: UpdateLeadInput = {
      id: lead[0].id,
      stage: 'genuine_lead',
      high_intent: true
    };

    await updateLead(updateInput);

    // Verify in database
    const updated = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, lead[0].id))
      .execute();

    expect(updated).toHaveLength(1);
    expect(updated[0].stage).toEqual('genuine_lead');
    expect(updated[0].high_intent).toBe(true);
    expect(updated[0].name).toEqual(testLead.name); // Unchanged
  });

  it('should recalculate lead score when relevant fields change', async () => {
    // Create lead
    const lead = await db.insert(leadsTable).values({
      ...testLead,
      high_intent: false,
      stage: 'raw_lead',
      urgency: 'no_urgency'
    }).returning().execute();

    const updateInput: UpdateLeadInput = {
      id: lead[0].id,
      high_intent: true,
      stage: 'genuine_lead',
      urgency: '1_week'
    };

    const result = await updateLead(updateInput);

    // Expected score: high_intent(30) + genuine_lead(40) + 1_week(20) = 90
    expect(result.lead_score).toEqual(90);
  });

  it('should prevent stage changes for completed sales', async () => {
    // Create lead with completed sale status
    const lead = await db.insert(leadsTable).values({
      ...testLead,
      stage: 'genuine_lead',
      follow_up_status: 'sale_completed'
    }).returning().execute();

    const updateInput: UpdateLeadInput = {
      id: lead[0].id,
      stage: 'raw_lead'
    };

    await expect(updateLead(updateInput)).rejects.toThrow(/cannot change stage of completed sale/i);
  });

  it('should allow valid stage changes for completed sales', async () => {
    // Create lead with completed sale status
    const lead = await db.insert(leadsTable).values({
      ...testLead,
      stage: 'raw_lead',
      follow_up_status: 'sale_completed'
    }).returning().execute();

    const updateInput: UpdateLeadInput = {
      id: lead[0].id,
      stage: 'genuine_lead' // This should be allowed
    };

    const result = await updateLead(updateInput);
    expect(result.stage).toEqual('genuine_lead');
  });

  it('should throw error for non-existent lead', async () => {
    const updateInput: UpdateLeadInput = {
      id: 99999,
      name: 'Should fail'
    };

    await expect(updateLead(updateInput)).rejects.toThrow(/lead with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create lead
    const lead = await db.insert(leadsTable).values(testLead).returning().execute();

    const updateInput: UpdateLeadInput = {
      id: lead[0].id,
      urgency: '2_weeks' // Only update urgency
    };

    const result = await updateLead(updateInput);

    expect(result.urgency).toEqual('2_weeks');
    expect(result.name).toEqual(testLead.name); // Should remain unchanged
    expect(result.email).toEqual(testLead.email); // Should remain unchanged
    expect(result.stage).toEqual(testLead.stage); // Should remain unchanged
  });

  it('should handle null value updates', async () => {
    // Create lead with values
    const lead = await db.insert(leadsTable).values({
      ...testLead,
      special_date: new Date(),
      occasion: 'Birthday'
    }).returning().execute();

    const updateInput: UpdateLeadInput = {
      id: lead[0].id,
      special_date: null,
      occasion: null
    };

    const result = await updateLead(updateInput);

    expect(result.special_date).toBeNull();
    expect(result.occasion).toBeNull();
  });
});
