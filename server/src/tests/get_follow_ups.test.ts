
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, leadsTable, followUpActivitiesTable } from '../db/schema';
import { getFollowUps } from '../handlers/get_follow_ups';

describe('getFollowUps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all follow-ups when no filters provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { name: 'Agent 1', email: 'agent1@test.com', role: 'sales_agent' },
        { name: 'Agent 2', email: 'agent2@test.com', role: 'sales_agent' }
      ])
      .returning()
      .execute();

    // Create test leads
    const leads = await db.insert(leadsTable)
      .values([
        {
          name: 'Lead 1',
          phone: '1234567890',
          stage: 'raw_lead',
          medium: 'phone',
          source: 'google',
          request_type: 'product_enquiry'
        },
        {
          name: 'Lead 2',
          phone: '0987654321',
          stage: 'in_contact',
          medium: 'email',
          source: 'meta',
          request_type: 'request_for_information'
        }
      ])
      .returning()
      .execute();

    // Create test follow-ups with different scheduled times
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await db.insert(followUpActivitiesTable)
      .values([
        {
          lead_id: leads[0].id,
          agent_id: users[0].id,
          title: 'First Follow-up',
          description: 'Initial contact',
          scheduled_at: tomorrow
        },
        {
          lead_id: leads[1].id,
          agent_id: users[1].id,
          title: 'Second Follow-up',
          description: 'Follow-up call',
          scheduled_at: nextWeek
        }
      ])
      .execute();

    const result = await getFollowUps();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('First Follow-up');
    expect(result[0].scheduled_at).toEqual(tomorrow);
    expect(result[1].title).toEqual('Second Follow-up');
    expect(result[1].scheduled_at).toEqual(nextWeek);
    
    // Verify ordering by scheduled_at (earliest first)
    expect(result[0].scheduled_at <= result[1].scheduled_at).toBe(true);
  });

  it('should filter by agent_id when provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { name: 'Agent 1', email: 'agent1@test.com', role: 'sales_agent' },
        { name: 'Agent 2', email: 'agent2@test.com', role: 'sales_agent' }
      ])
      .returning()
      .execute();

    // Create test lead
    const leads = await db.insert(leadsTable)
      .values([
        {
          name: 'Test Lead',
          phone: '1234567890',
          stage: 'raw_lead',
          medium: 'phone',
          source: 'google',
          request_type: 'product_enquiry'
        }
      ])
      .returning()
      .execute();

    // Create follow-ups for different agents
    await db.insert(followUpActivitiesTable)
      .values([
        {
          lead_id: leads[0].id,
          agent_id: users[0].id,
          title: 'Agent 1 Follow-up',
          scheduled_at: new Date()
        },
        {
          lead_id: leads[0].id,
          agent_id: users[1].id,
          title: 'Agent 2 Follow-up',
          scheduled_at: new Date()
        }
      ])
      .execute();

    const result = await getFollowUps(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Agent 1 Follow-up');
    expect(result[0].agent_id).toEqual(users[0].id);
  });

  it('should filter by lead_id when provided', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([
        { name: 'Test Agent', email: 'agent@test.com', role: 'sales_agent' }
      ])
      .returning()
      .execute();

    // Create test leads
    const leads = await db.insert(leadsTable)
      .values([
        {
          name: 'Lead 1',
          phone: '1234567890',
          stage: 'raw_lead',
          medium: 'phone',
          source: 'google',
          request_type: 'product_enquiry'
        },
        {
          name: 'Lead 2',
          phone: '0987654321',
          stage: 'in_contact',
          medium: 'email',
          source: 'meta',
          request_type: 'request_for_information'
        }
      ])
      .returning()
      .execute();

    // Create follow-ups for different leads
    await db.insert(followUpActivitiesTable)
      .values([
        {
          lead_id: leads[0].id,
          agent_id: users[0].id,
          title: 'Lead 1 Follow-up',
          scheduled_at: new Date()
        },
        {
          lead_id: leads[1].id,
          agent_id: users[0].id,
          title: 'Lead 2 Follow-up',
          scheduled_at: new Date()
        }
      ])
      .execute();

    const result = await getFollowUps(undefined, leads[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Lead 1 Follow-up');
    expect(result[0].lead_id).toEqual(leads[0].id);
  });

  it('should filter by both agent_id and lead_id when both provided', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        { name: 'Agent 1', email: 'agent1@test.com', role: 'sales_agent' },
        { name: 'Agent 2', email: 'agent2@test.com', role: 'sales_agent' }
      ])
      .returning()
      .execute();

    // Create test leads
    const leads = await db.insert(leadsTable)
      .values([
        {
          name: 'Lead 1',
          phone: '1234567890',
          stage: 'raw_lead',
          medium: 'phone',
          source: 'google',
          request_type: 'product_enquiry'
        },
        {
          name: 'Lead 2',
          phone: '0987654321',
          stage: 'in_contact',
          medium: 'email',
          source: 'meta',
          request_type: 'request_for_information'
        }
      ])
      .returning()
      .execute();

    // Create follow-ups with different combinations
    await db.insert(followUpActivitiesTable)
      .values([
        {
          lead_id: leads[0].id,
          agent_id: users[0].id,
          title: 'Agent 1 - Lead 1',
          scheduled_at: new Date()
        },
        {
          lead_id: leads[0].id,
          agent_id: users[1].id,
          title: 'Agent 2 - Lead 1',
          scheduled_at: new Date()
        },
        {
          lead_id: leads[1].id,
          agent_id: users[0].id,
          title: 'Agent 1 - Lead 2',
          scheduled_at: new Date()
        }
      ])
      .execute();

    const result = await getFollowUps(users[0].id, leads[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Agent 1 - Lead 1');
    expect(result[0].agent_id).toEqual(users[0].id);
    expect(result[0].lead_id).toEqual(leads[0].id);
  });

  it('should return empty array when no follow-ups match filters', async () => {
    // Create test user and lead
    const users = await db.insert(usersTable)
      .values([
        { name: 'Test Agent', email: 'agent@test.com', role: 'sales_agent' }
      ])
      .returning()
      .execute();

    const leads = await db.insert(leadsTable)
      .values([
        {
          name: 'Test Lead',
          phone: '1234567890',
          stage: 'raw_lead',
          medium: 'phone',
          source: 'google',
          request_type: 'product_enquiry'
        }
      ])
      .returning()
      .execute();

    // Create one follow-up
    await db.insert(followUpActivitiesTable)
      .values([
        {
          lead_id: leads[0].id,
          agent_id: users[0].id,
          title: 'Test Follow-up',
          scheduled_at: new Date()
        }
      ])
      .execute();

    // Query with non-existent agent_id
    const result = await getFollowUps(999);

    expect(result).toHaveLength(0);
  });

  it('should include all required follow-up fields', async () => {
    // Create test user and lead
    const users = await db.insert(usersTable)
      .values([
        { name: 'Test Agent', email: 'agent@test.com', role: 'sales_agent' }
      ])
      .returning()
      .execute();

    const leads = await db.insert(leadsTable)
      .values([
        {
          name: 'Test Lead',
          phone: '1234567890',
          stage: 'raw_lead',
          medium: 'phone',
          source: 'google',
          request_type: 'product_enquiry'
        }
      ])
      .returning()
      .execute();

    const scheduledTime = new Date();
    await db.insert(followUpActivitiesTable)
      .values([
        {
          lead_id: leads[0].id,
          agent_id: users[0].id,
          title: 'Complete Follow-up',
          description: 'Detailed description',
          scheduled_at: scheduledTime
        }
      ])
      .execute();

    const result = await getFollowUps();

    expect(result).toHaveLength(1);
    const followUp = result[0];
    
    expect(followUp.id).toBeDefined();
    expect(followUp.lead_id).toEqual(leads[0].id);
    expect(followUp.agent_id).toEqual(users[0].id);
    expect(followUp.title).toEqual('Complete Follow-up');
    expect(followUp.description).toEqual('Detailed description');
    expect(followUp.scheduled_at).toEqual(scheduledTime);
    expect(followUp.completed).toEqual(false);
    expect(followUp.completed_at).toBeNull();
    expect(followUp.created_at).toBeInstanceOf(Date);
  });
});
