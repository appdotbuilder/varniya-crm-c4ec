
import { db } from '../db';
import { followUpActivitiesTable } from '../db/schema';
import { type FollowUpActivity } from '../schema';
import { eq } from 'drizzle-orm';

export const completeFollowUp = async (id: number): Promise<FollowUpActivity> => {
  try {
    // Update the follow-up activity to mark it as completed
    const result = await db.update(followUpActivitiesTable)
      .set({
        completed: true,
        completed_at: new Date()
      })
      .where(eq(followUpActivitiesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Follow-up activity with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Follow-up completion failed:', error);
    throw error;
  }
};
