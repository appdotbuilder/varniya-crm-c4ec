
import { db } from '../db';
import { leadNotesTable, leadsTable } from '../db/schema';
import { type CreateLeadNoteInput, type LeadNote } from '../schema';
import { eq } from 'drizzle-orm';

export const createLeadNote = async (input: CreateLeadNoteInput): Promise<LeadNote> => {
  try {
    // Start a transaction to ensure both operations succeed or fail together
    const result = await db.transaction(async (tx) => {
      // Insert the lead note
      const noteResult = await tx.insert(leadNotesTable)
        .values({
          lead_id: input.lead_id,
          agent_id: input.agent_id,
          note: input.note
        })
        .returning()
        .execute();

      // Update the lead's last_contact_at timestamp
      await tx.update(leadsTable)
        .set({
          last_contact_at: new Date(),
          updated_at: new Date()
        })
        .where(eq(leadsTable.id, input.lead_id))
        .execute();

      return noteResult[0];
    });

    return result;
  } catch (error) {
    console.error('Lead note creation failed:', error);
    throw error;
  }
};
