
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, leadsTable, leadNotesTable } from '../db/schema';
import { getLeadNotes } from '../handlers/get_lead_notes';

describe('getLeadNotes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return notes for a specific lead ordered by creation date', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    // Create test lead
    const [lead] = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();

    // Create multiple notes with different timestamps
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    await db.insert(leadNotesTable)
      .values([
        {
          lead_id: lead.id,
          agent_id: user.id,
          note: 'First note',
          created_at: earlier
        },
        {
          lead_id: lead.id,
          agent_id: user.id,
          note: 'Second note',
          created_at: now
        }
      ])
      .execute();

    const results = await getLeadNotes(lead.id);

    expect(results).toHaveLength(2);
    expect(results[0].note).toEqual('Second note'); // Most recent first
    expect(results[1].note).toEqual('First note');
    expect(results[0].lead_id).toEqual(lead.id);
    expect(results[0].agent_id).toEqual(user.id);
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for lead with no notes', async () => {
    // Create test lead without any notes
    const [lead] = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();

    const results = await getLeadNotes(lead.id);

    expect(results).toHaveLength(0);
  });

  it('should only return notes for the specified lead', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    // Create two test leads
    const [lead1] = await db.insert(leadsTable)
      .values({
        name: 'Lead 1',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();

    const [lead2] = await db.insert(leadsTable)
      .values({
        name: 'Lead 2',
        stage: 'raw_lead',
        medium: 'email',
        source: 'meta',
        request_type: 'product_enquiry'
      })
      .returning()
      .execute();

    // Create notes for both leads
    await db.insert(leadNotesTable)
      .values([
        {
          lead_id: lead1.id,
          agent_id: user.id,
          note: 'Note for lead 1'
        },
        {
          lead_id: lead2.id,
          agent_id: user.id,
          note: 'Note for lead 2'
        }
      ])
      .execute();

    const results = await getLeadNotes(lead1.id);

    expect(results).toHaveLength(1);
    expect(results[0].note).toEqual('Note for lead 1');
    expect(results[0].lead_id).toEqual(lead1.id);
  });
});
