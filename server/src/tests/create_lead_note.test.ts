
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadNotesTable, leadsTable, usersTable } from '../db/schema';
import { type CreateLeadNoteInput } from '../schema';
import { createLeadNote } from '../handlers/create_lead_note';
import { eq } from 'drizzle-orm';

describe('createLeadNote', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a lead note', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@example.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite lead
    const leadResult = await db.insert(leadsTable)
      .values({
        phone: '1234567890',
        name: 'Test Lead',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry',
        assigned_agent_id: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    const testInput: CreateLeadNoteInput = {
      lead_id: leadId,
      agent_id: userId,
      note: 'This is a test note for the lead'
    };

    const result = await createLeadNote(testInput);

    // Verify note fields
    expect(result.id).toBeDefined();
    expect(result.lead_id).toEqual(leadId);
    expect(result.agent_id).toEqual(userId);
    expect(result.note).toEqual('This is a test note for the lead');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save lead note to database', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@example.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite lead
    const leadResult = await db.insert(leadsTable)
      .values({
        phone: '1234567890',
        name: 'Test Lead',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry',
        assigned_agent_id: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    const testInput: CreateLeadNoteInput = {
      lead_id: leadId,
      agent_id: userId,
      note: 'Database verification note'
    };

    const result = await createLeadNote(testInput);

    // Query database to verify note was saved
    const notes = await db.select()
      .from(leadNotesTable)
      .where(eq(leadNotesTable.id, result.id))
      .execute();

    expect(notes).toHaveLength(1);
    expect(notes[0].lead_id).toEqual(leadId);
    expect(notes[0].agent_id).toEqual(userId);
    expect(notes[0].note).toEqual('Database verification note');
    expect(notes[0].created_at).toBeInstanceOf(Date);
  });

  it('should update lead last_contact_at timestamp', async () => {
    // Create prerequisite user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@example.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create prerequisite lead
    const leadResult = await db.insert(leadsTable)
      .values({
        phone: '1234567890',
        name: 'Test Lead',
        stage: 'raw_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry',
        assigned_agent_id: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;
    const originalTimestamp = leadResult[0].last_contact_at;

    const testInput: CreateLeadNoteInput = {
      lead_id: leadId,
      agent_id: userId,
      note: 'Contact timestamp test note'
    };

    const beforeCreateTime = new Date();
    await createLeadNote(testInput);

    // Query updated lead
    const updatedLeads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, leadId))
      .execute();

    const updatedLead = updatedLeads[0];
    expect(updatedLead.last_contact_at).not.toEqual(originalTimestamp);
    expect(updatedLead.last_contact_at).toBeInstanceOf(Date);
    expect(updatedLead.last_contact_at!.getTime()).toBeGreaterThanOrEqual(beforeCreateTime.getTime());
    expect(updatedLead.updated_at).toBeInstanceOf(Date);
    expect(updatedLead.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreateTime.getTime());
  });

  it('should create note with non-existent references', async () => {
    // Since the schema doesn't enforce foreign key constraints,
    // this should succeed even with non-existent IDs
    const testInput: CreateLeadNoteInput = {
      lead_id: 999999, // Non-existent lead ID
      agent_id: 999999, // Non-existent agent ID
      note: 'This note will be created despite invalid references'
    };

    const result = await createLeadNote(testInput);

    expect(result.id).toBeDefined();
    expect(result.lead_id).toEqual(999999);
    expect(result.agent_id).toEqual(999999);
    expect(result.note).toEqual('This note will be created despite invalid references');
    expect(result.created_at).toBeInstanceOf(Date);

    // Note: The lead update will silently fail since lead doesn't exist,
    // but the note creation will succeed
  });
});
