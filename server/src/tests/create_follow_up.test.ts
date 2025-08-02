
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { followUpActivitiesTable, leadsTable, usersTable } from '../db/schema';
import { type CreateFollowUpInput } from '../schema';
import { createFollowUp } from '../handlers/create_follow_up';
import { eq } from 'drizzle-orm';

describe('createFollowUp', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testAgentId: number;
  let testLeadId: number;

  beforeEach(async () => {
    // Create test agent
    const agent = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();
    testAgentId = agent[0].id;

    // Create test lead
    const lead = await db.insert(leadsTable)
      .values({
        phone: '1234567890',
        email: 'lead@test.com',
        name: 'Test Lead',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'direct_unknown',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();
    testLeadId = lead[0].id;
  });

  it('should create a follow-up activity', async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 1);

    const testInput: CreateFollowUpInput = {
      lead_id: testLeadId,
      agent_id: testAgentId,
      title: 'Follow up call',
      description: 'Call to discuss pricing details',
      scheduled_at: futureDate
    };

    const result = await createFollowUp(testInput);

    // Basic field validation
    expect(result.lead_id).toEqual(testLeadId);
    expect(result.agent_id).toEqual(testAgentId);
    expect(result.title).toEqual('Follow up call');
    expect(result.description).toEqual('Call to discuss pricing details');
    expect(result.scheduled_at).toEqual(futureDate);
    expect(result.completed).toEqual(false);
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save follow-up activity to database', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const testInput: CreateFollowUpInput = {
      lead_id: testLeadId,
      agent_id: testAgentId,
      title: 'Schedule demo',
      description: 'Product demonstration for client',
      scheduled_at: futureDate
    };

    const result = await createFollowUp(testInput);

    // Query using proper drizzle syntax
    const followUps = await db.select()
      .from(followUpActivitiesTable)
      .where(eq(followUpActivitiesTable.id, result.id))
      .execute();

    expect(followUps).toHaveLength(1);
    expect(followUps[0].title).toEqual('Schedule demo');
    expect(followUps[0].description).toEqual('Product demonstration for client');
    expect(followUps[0].lead_id).toEqual(testLeadId);
    expect(followUps[0].agent_id).toEqual(testAgentId);
    expect(followUps[0].completed).toEqual(false);
    expect(followUps[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject follow-up scheduled in the past', async () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);

    const testInput: CreateFollowUpInput = {
      lead_id: testLeadId,
      agent_id: testAgentId,
      title: 'Past follow up',
      description: 'This should fail',
      scheduled_at: pastDate
    };

    await expect(createFollowUp(testInput)).rejects.toThrow(/future date/i);
  });

  it('should reject follow-up with non-existent lead', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const testInput: CreateFollowUpInput = {
      lead_id: 99999, // Non-existent lead ID
      agent_id: testAgentId,
      title: 'Invalid lead follow up',
      description: 'This should fail',
      scheduled_at: futureDate
    };

    await expect(createFollowUp(testInput)).rejects.toThrow(/lead not found/i);
  });

  it('should reject follow-up with non-existent agent', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const testInput: CreateFollowUpInput = {
      lead_id: testLeadId,
      agent_id: 99999, // Non-existent agent ID
      title: 'Invalid agent follow up',
      description: 'This should fail',
      scheduled_at: futureDate
    };

    await expect(createFollowUp(testInput)).rejects.toThrow(/agent not found/i);
  });

  it('should handle null description', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const testInput: CreateFollowUpInput = {
      lead_id: testLeadId,
      agent_id: testAgentId,
      title: 'Follow up without description',
      description: null,
      scheduled_at: futureDate
    };

    const result = await createFollowUp(testInput);

    expect(result.title).toEqual('Follow up without description');
    expect(result.description).toBeNull();
    expect(result.lead_id).toEqual(testLeadId);
    expect(result.agent_id).toEqual(testAgentId);
  });
});
