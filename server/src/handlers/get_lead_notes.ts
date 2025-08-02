
import { db } from '../db';
import { leadNotesTable, usersTable } from '../db/schema';
import { type LeadNote } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getLeadNotes(leadId: number): Promise<LeadNote[]> {
  try {
    const results = await db.select()
      .from(leadNotesTable)
      .innerJoin(usersTable, eq(leadNotesTable.agent_id, usersTable.id))
      .where(eq(leadNotesTable.lead_id, leadId))
      .orderBy(desc(leadNotesTable.created_at))
      .execute();

    // Transform joined results back to LeadNote format
    return results.map(result => ({
      id: result.lead_notes.id,
      lead_id: result.lead_notes.lead_id,
      agent_id: result.lead_notes.agent_id,
      note: result.lead_notes.note,
      created_at: result.lead_notes.created_at
    }));
  } catch (error) {
    console.error('Get lead notes failed:', error);
    throw error;
  }
}
