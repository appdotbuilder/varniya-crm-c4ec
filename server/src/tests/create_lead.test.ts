
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { createLead } from '../handlers/create_lead';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateLeadInput = {
  phone: '+1234567890',
  email: 'test@example.com',
  name: 'Test Lead',
  stage: 'raw_lead',
  medium: 'website',
  source: 'google',
  high_intent: true,
  request_type: 'product_enquiry',
  urgency: '1_week',
  special_date: new Date('2024-12-25'),
  occasion: 'Christmas',
  assigned_agent_id: null
};

describe('createLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lead with correct data', async () => {
    const result = await createLead(testInput);

    // Verify all fields are set correctly
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test Lead');
    expect(result.stage).toEqual('raw_lead');
    expect(result.medium).toEqual('website');
    expect(result.source).toEqual('google');
    expect(result.high_intent).toEqual(true);
    expect(result.request_type).toEqual('product_enquiry');
    expect(result.urgency).toEqual('1_week');
    expect(result.special_date).toEqual(new Date('2024-12-25'));
    expect(result.occasion).toEqual('Christmas');
    expect(result.assigned_agent_id).toBeNull();
    
    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.last_contact_at).toBeNull();
    expect(result.status).toBeNull();
    expect(result.follow_up_status).toBeNull();
    expect(typeof result.lead_score).toBe('number');
  });

  it('should save lead to database', async () => {
    const result = await createLead(testInput);

    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(leads).toHaveLength(1);
    expect(leads[0].name).toEqual('Test Lead');
    expect(leads[0].phone).toEqual('+1234567890');
    expect(leads[0].email).toEqual('test@example.com');
    expect(leads[0].high_intent).toEqual(true);
    expect(leads[0].created_at).toBeInstanceOf(Date);
  });

  it('should calculate lead score for high intent lead', async () => {
    const highIntentInput: CreateLeadInput = {
      ...testInput,
      high_intent: true,
      source: 'google',
      request_type: 'product_enquiry'
    };

    const result = await createLead(highIntentInput);

    // high_intent (50) + google (20) + product_enquiry (30) = 100
    expect(result.lead_score).toEqual(100);
  });

  it('should calculate lead score for low intent lead', async () => {
    const lowIntentInput: CreateLeadInput = {
      ...testInput,
      high_intent: false,
      source: 'direct_unknown',
      request_type: 'other'
    };

    const result = await createLead(lowIntentInput);

    // low_intent (10) + direct_unknown (5) + other (5) = 20
    expect(result.lead_score).toEqual(20);
  });

  it('should calculate lead score for referral source', async () => {
    const referralInput: CreateLeadInput = {
      ...testInput,
      source: 'referral',
      request_type: 'request_for_information'
    };

    const result = await createLead(referralInput);

    // high_intent (50) + referral (25) + request_for_information (20) = 95
    expect(result.lead_score).toEqual(95);
  });

  it('should create lead with assigned agent', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@example.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    const agent = userResult[0];

    const inputWithAgent: CreateLeadInput = {
      ...testInput,
      assigned_agent_id: agent.id
    };

    const result = await createLead(inputWithAgent);

    expect(result.assigned_agent_id).toEqual(agent.id);

    // Verify in database
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(leads[0].assigned_agent_id).toEqual(agent.id);
  });

  it('should create lead with minimal required fields', async () => {
    const minimalInput: CreateLeadInput = {
      phone: null,
      email: null,
      name: null,
      stage: 'raw_lead',
      medium: 'phone',
      source: 'organic',
      high_intent: false,
      request_type: 'other',
      urgency: null,
      special_date: null,
      occasion: null,
      assigned_agent_id: null
    };

    const result = await createLead(minimalInput);

    expect(result.phone).toBeNull();
    expect(result.email).toBeNull();
    expect(result.name).toBeNull();
    expect(result.stage).toEqual('raw_lead');
    expect(result.medium).toEqual('phone');
    expect(result.source).toEqual('organic');
    expect(result.high_intent).toEqual(false);
    expect(result.request_type).toEqual('other');
    expect(result.lead_score).toEqual(30); // low_intent (10) + organic (15) + other (5) = 30
  });
});
