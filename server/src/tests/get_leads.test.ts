
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { type GetLeadsInput, type CreateLeadInput } from '../schema';
import { getLeads } from '../handlers/get_leads';

// Test data
const testUser = {
  name: 'Test Agent',
  email: 'agent@test.com',
  role: 'sales_agent' as const
};

const testLead1: CreateLeadInput = {
  phone: '+1234567890',
  email: 'lead1@test.com',
  name: 'Test Lead 1',
  stage: 'raw_lead',
  medium: 'phone',
  source: 'google',
  high_intent: true,
  request_type: 'product_enquiry',
  urgency: '1_week',
  special_date: null,
  occasion: null,
  assigned_agent_id: null
};

const testLead2: CreateLeadInput = {
  phone: '+0987654321',
  email: 'lead2@test.com',
  name: 'Test Lead 2',
  stage: 'in_contact',
  medium: 'email',
  source: 'meta',
  high_intent: false,
  request_type: 'request_for_information',
  urgency: '1_month',
  special_date: null,
  occasion: null,
  assigned_agent_id: null
};

describe('getLeads', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all leads with default pagination', async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test leads one by one to ensure different timestamps
    await db.insert(leadsTable)
      .values({ ...testLead1, assigned_agent_id: userId })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(leadsTable)
      .values({ ...testLead2, assigned_agent_id: userId })
      .execute();

    const input: GetLeadsInput = {
      limit: 50,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(2);
    // Verify both leads are returned (order might vary due to timing)
    const leadNames = results.map(r => r.name).sort();
    expect(leadNames).toEqual(['Test Lead 1', 'Test Lead 2']);
    
    // Verify both have the correct agent assigned
    expect(results[0].assigned_agent_id).toEqual(userId);
    expect(results[1].assigned_agent_id).toEqual(userId);
    
    // Verify the high_intent values are correct
    const highIntentLead = results.find(r => r.name === 'Test Lead 1');
    const lowIntentLead = results.find(r => r.name === 'Test Lead 2');
    expect(highIntentLead?.high_intent).toEqual(true);
    expect(lowIntentLead?.high_intent).toEqual(false);
  });

  it('should filter leads by stage', async () => {
    // Create test leads
    await db.insert(leadsTable)
      .values([testLead1, testLead2])
      .execute();

    const input: GetLeadsInput = {
      stage: 'raw_lead',
      limit: 50,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(1);
    expect(results[0].stage).toEqual('raw_lead');
    expect(results[0].name).toEqual('Test Lead 1');
  });

  it('should filter leads by source', async () => {
    // Create test leads
    await db.insert(leadsTable)
      .values([testLead1, testLead2])
      .execute();

    const input: GetLeadsInput = {
      source: 'google',
      limit: 50,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(1);
    expect(results[0].source).toEqual('google');
    expect(results[0].name).toEqual('Test Lead 1');
  });

  it('should filter leads by high_intent flag', async () => {
    // Create test leads
    await db.insert(leadsTable)
      .values([testLead1, testLead2])
      .execute();

    const input: GetLeadsInput = {
      high_intent: true,
      limit: 50,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(1);
    expect(results[0].high_intent).toEqual(true);
    expect(results[0].name).toEqual('Test Lead 1');
  });

  it('should filter leads by assigned agent', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create leads - one assigned, one unassigned
    await db.insert(leadsTable)
      .values([
        { ...testLead1, assigned_agent_id: userId },
        testLead2 // No assigned agent
      ])
      .execute();

    const input: GetLeadsInput = {
      assigned_agent_id: userId,
      limit: 50,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(1);
    expect(results[0].assigned_agent_id).toEqual(userId);
    expect(results[0].name).toEqual('Test Lead 1');
  });

  it('should apply multiple filters correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create multiple leads with different combinations
    await db.insert(leadsTable)
      .values([
        { ...testLead1, assigned_agent_id: userId }, // google + high_intent
        { ...testLead2, source: 'google', high_intent: false }, // google + !high_intent
        { ...testLead1, source: 'meta', high_intent: true } // meta + high_intent
      ])
      .execute();

    const input: GetLeadsInput = {
      source: 'google',
      high_intent: true,
      limit: 50,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(1);
    expect(results[0].source).toEqual('google');
    expect(results[0].high_intent).toEqual(true);
    expect(results[0].assigned_agent_id).toEqual(userId);
  });

  it('should respect pagination limits', async () => {
    // Create multiple leads
    const leads = Array.from({ length: 5 }, (_, i) => ({
      ...testLead1,
      name: `Test Lead ${i + 1}`,
      email: `lead${i + 1}@test.com`,
      phone: `+123456789${i}`
    }));

    await db.insert(leadsTable)
      .values(leads)
      .execute();

    const input: GetLeadsInput = {
      limit: 3,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(3);
  });

  it('should handle pagination offset correctly', async () => {
    // Create multiple leads
    const leads = Array.from({ length: 5 }, (_, i) => ({
      ...testLead1,
      name: `Test Lead ${i + 1}`,
      email: `lead${i + 1}@test.com`,
      phone: `+123456789${i}`
    }));

    await db.insert(leadsTable)
      .values(leads)
      .execute();

    const input: GetLeadsInput = {
      limit: 2,
      offset: 2
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(2);
    // Results should be ordered by created_at desc, so we get the 3rd and 4th most recent
  });

  it('should return empty array when no leads match filters', async () => {
    // Create test leads
    await db.insert(leadsTable)
      .values([testLead1, testLead2])
      .execute();

    const input: GetLeadsInput = {
      stage: 'junk', // No leads with this stage
      limit: 50,
      offset: 0
    };
    const results = await getLeads(input);

    expect(results).toHaveLength(0);
  });
});
