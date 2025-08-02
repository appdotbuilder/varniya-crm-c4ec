
import { db } from '../db';
import { followUpActivitiesTable, leadsTable, usersTable } from '../db/schema';
import { type FollowUpActivity } from '../schema';
import { eq, and, asc } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getFollowUps(agentId?: number, leadId?: number): Promise<FollowUpActivity[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (agentId !== undefined) {
      conditions.push(eq(followUpActivitiesTable.agent_id, agentId));
    }

    if (leadId !== undefined) {
      conditions.push(eq(followUpActivitiesTable.lead_id, leadId));
    }

    // Build the complete query in one go to maintain proper types
    const baseQuery = db.select()
      .from(followUpActivitiesTable)
      .innerJoin(leadsTable, eq(followUpActivitiesTable.lead_id, leadsTable.id))
      .innerJoin(usersTable, eq(followUpActivitiesTable.agent_id, usersTable.id));

    // Apply conditions and ordering
    const query = conditions.length > 0
      ? baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(asc(followUpActivitiesTable.scheduled_at))
      : baseQuery.orderBy(asc(followUpActivitiesTable.scheduled_at));

    const results = await query.execute();

    // Map joined results back to FollowUpActivity schema
    return results.map(result => ({
      id: result.follow_up_activities.id,
      lead_id: result.follow_up_activities.lead_id,
      agent_id: result.follow_up_activities.agent_id,
      title: result.follow_up_activities.title,
      description: result.follow_up_activities.description,
      scheduled_at: result.follow_up_activities.scheduled_at,
      completed: result.follow_up_activities.completed,
      completed_at: result.follow_up_activities.completed_at,
      created_at: result.follow_up_activities.created_at
    }));
  } catch (error) {
    console.error('Get follow-ups failed:', error);
    throw error;
  }
}
