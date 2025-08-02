
import { db } from '../db';
import { followUpActivitiesTable, leadsTable, usersTable } from '../db/schema';
import { type CreateFollowUpInput, type FollowUpActivity } from '../schema';
import { eq } from 'drizzle-orm';

export const createFollowUp = async (input: CreateFollowUpInput): Promise<FollowUpActivity> => {
  try {
    // Validate that scheduled_at is in the future
    const now = new Date();
    if (input.scheduled_at <= now) {
      throw new Error('Follow-up must be scheduled for a future date');
    }

    // Verify that the lead exists
    const lead = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, input.lead_id))
      .execute();

    if (lead.length === 0) {
      throw new Error('Lead not found');
    }

    // Verify that the agent exists
    const agent = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.agent_id))
      .execute();

    if (agent.length === 0) {
      throw new Error('Agent not found');
    }

    // Insert follow-up activity record
    const result = await db.insert(followUpActivitiesTable)
      .values({
        lead_id: input.lead_id,
        agent_id: input.agent_id,
        title: input.title,
        description: input.description,
        scheduled_at: input.scheduled_at
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Follow-up creation failed:', error);
    throw error;
  }
};
