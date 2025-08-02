
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, leadsTable, followUpActivitiesTable } from '../db/schema';
import { completeFollowUp } from '../handlers/complete_follow_up';
import { eq } from 'drizzle-orm';

describe('completeFollowUp', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should mark follow-up activity as completed', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    // Create prerequisite lead
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '1234567890',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'direct_unknown',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();

    // Create follow-up activity
    const followUpResult = await db.insert(followUpActivitiesTable)
      .values({
        lead_id: leadResult[0].id,
        agent_id: userResult[0].id,
        title: 'Follow up call',
        description: 'Call customer about order status',
        scheduled_at: new Date()
      })
      .returning()
      .execute();

    const followUpId = followUpResult[0].id;

    // Complete the follow-up
    const result = await completeFollowUp(followUpId);

    // Verify the result
    expect(result.id).toEqual(followUpId);
    expect(result.completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.title).toEqual('Follow up call');
    expect(result.description).toEqual('Call customer about order status');
  });

  it('should save completion to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    // Create prerequisite lead
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '1234567890',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'direct_unknown',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();

    // Create follow-up activity
    const followUpResult = await db.insert(followUpActivitiesTable)
      .values({
        lead_id: leadResult[0].id,
        agent_id: userResult[0].id,
        title: 'Follow up call',
        scheduled_at: new Date()
      })
      .returning()
      .execute();

    const followUpId = followUpResult[0].id;

    // Complete the follow-up
    await completeFollowUp(followUpId);

    // Verify in database
    const dbResult = await db.select()
      .from(followUpActivitiesTable)
      .where(eq(followUpActivitiesTable.id, followUpId))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].completed).toBe(true);
    expect(dbResult[0].completed_at).toBeInstanceOf(Date);
    expect(dbResult[0].title).toEqual('Follow up call');
  });

  it('should throw error for non-existent follow-up activity', async () => {
    const nonExistentId = 99999;

    await expect(completeFollowUp(nonExistentId))
      .rejects.toThrow(/Follow-up activity with id 99999 not found/i);
  });

  it('should preserve existing follow-up data when completing', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    // Create prerequisite lead
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '1234567890',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'direct_unknown',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();

    const scheduledDate = new Date('2024-01-15T10:00:00Z');
    
    // Create follow-up activity with all fields
    const followUpResult = await db.insert(followUpActivitiesTable)
      .values({
        lead_id: leadResult[0].id,
        agent_id: userResult[0].id,
        title: 'Important follow-up',
        description: 'Detailed description here',
        scheduled_at: scheduledDate
      })
      .returning()
      .execute();

    const followUpId = followUpResult[0].id;

    // Complete the follow-up
    const result = await completeFollowUp(followUpId);

    // Verify all original data is preserved
    expect(result.lead_id).toEqual(leadResult[0].id);
    expect(result.agent_id).toEqual(userResult[0].id);
    expect(result.title).toEqual('Important follow-up');
    expect(result.description).toEqual('Detailed description here');
    expect(result.scheduled_at).toEqual(scheduledDate);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify completion data is set
    expect(result.completed).toBe(true);
    expect(result.completed_at).toBeInstanceOf(Date);
  });
});
