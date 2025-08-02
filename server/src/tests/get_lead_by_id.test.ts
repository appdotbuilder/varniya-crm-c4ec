
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable, usersTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { getLeadById } from '../handlers/get_lead_by_id';

const testAgent = {
  name: 'Test Agent',
  email: 'agent@test.com',
  role: 'sales_agent' as const,
  active: true
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
  urgency: '1_week',
  special_date: new Date('2024-12-25'),
  occasion: 'Christmas',
  assigned_agent_id: null
};

describe('getLeadById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return lead by ID', async () => {
    // Create agent first
    const agentResult = await db.insert(usersTable)
      .values(testAgent)
      .returning()
      .execute();
    const agentId = agentResult[0].id;

    // Create lead with agent assignment
    const leadResult = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_agent_id: agentId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    const result = await getLeadById(leadId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(leadId);
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test Lead');
    expect(result!.stage).toEqual('raw_lead');
    expect(result!.medium).toEqual('phone');
    expect(result!.source).toEqual('google');
    expect(result!.high_intent).toEqual(false);
    expect(result!.request_type).toEqual('product_enquiry');
    expect(result!.urgency).toEqual('1_week');
    expect(result!.special_date).toBeInstanceOf(Date);
    expect(result!.occasion).toEqual('Christmas');
    expect(result!.assigned_agent_id).toEqual(agentId);
    expect(result!.lead_score).toEqual(0);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.last_contact_at).toBeNull();
  });

  it('should return null for non-existent lead', async () => {
    const result = await getLeadById(999999);
    expect(result).toBeNull();
  });

  it('should handle lead with minimal data', async () => {
    // Create lead with only required fields
    const minimalLead = {
      phone: null,
      email: null,
      name: null,
      stage: 'raw_lead' as const,
      medium: 'website' as const,
      source: 'organic' as const,
      high_intent: false,
      request_type: 'other' as const,
      urgency: null,
      special_date: null,
      occasion: null,
      assigned_agent_id: null
    };

    const leadResult = await db.insert(leadsTable)
      .values(minimalLead)
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    const result = await getLeadById(leadId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(leadId);
    expect(result!.phone).toBeNull();
    expect(result!.email).toBeNull();
    expect(result!.name).toBeNull();
    expect(result!.stage).toEqual('raw_lead');
    expect(result!.medium).toEqual('website');
    expect(result!.source).toEqual('organic');
    expect(result!.request_type).toEqual('other');
    expect(result!.urgency).toBeNull();
    expect(result!.special_date).toBeNull();
    expect(result!.occasion).toBeNull();
    expect(result!.assigned_agent_id).toBeNull();
    expect(result!.lead_score).toEqual(0);
  });

  it('should handle lead with all optional fields filled', async () => {
    // Create agent first
    const agentResult = await db.insert(usersTable)
      .values(testAgent)
      .returning()
      .execute();
    const agentId = agentResult[0].id;

    // Create lead with all fields
    const fullLead = {
      phone: '+1234567890',
      email: 'full@example.com',
      name: 'Full Test Lead',
      stage: 'genuine_lead' as const,
      status: 'first_call_done' as const,
      follow_up_status: 'follow_up' as const,
      medium: 'email' as const,
      source: 'meta' as const,
      high_intent: true,
      request_type: 'product_enquiry' as const,
      urgency: '2_weeks' as const,
      special_date: new Date('2024-01-15'),
      occasion: 'Birthday',
      assigned_agent_id: agentId,
      lead_score: 85,
      last_contact_at: new Date('2024-01-10')
    };

    const leadResult = await db.insert(leadsTable)
      .values(fullLead)
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    const result = await getLeadById(leadId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(leadId);
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.email).toEqual('full@example.com');
    expect(result!.name).toEqual('Full Test Lead');
    expect(result!.stage).toEqual('genuine_lead');
    expect(result!.status).toEqual('first_call_done');
    expect(result!.follow_up_status).toEqual('follow_up');
    expect(result!.medium).toEqual('email');
    expect(result!.source).toEqual('meta');
    expect(result!.high_intent).toEqual(true);
    expect(result!.request_type).toEqual('product_enquiry');
    expect(result!.urgency).toEqual('2_weeks');
    expect(result!.special_date).toBeInstanceOf(Date);
    expect(result!.occasion).toEqual('Birthday');
    expect(result!.assigned_agent_id).toEqual(agentId);
    expect(result!.lead_score).toEqual(85);
    expect(result!.last_contact_at).toBeInstanceOf(Date);
  });
});
