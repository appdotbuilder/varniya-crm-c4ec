
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type GetLeadsInput, type Lead } from '../schema';
import { eq, and, desc, SQL } from 'drizzle-orm';

export async function getLeads(input: GetLeadsInput): Promise<Lead[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input.stage !== undefined) {
      conditions.push(eq(leadsTable.stage, input.stage));
    }

    if (input.status !== undefined) {
      conditions.push(eq(leadsTable.status, input.status));
    }

    if (input.follow_up_status !== undefined) {
      conditions.push(eq(leadsTable.follow_up_status, input.follow_up_status));
    }

    if (input.assigned_agent_id !== undefined) {
      conditions.push(eq(leadsTable.assigned_agent_id, input.assigned_agent_id));
    }

    if (input.source !== undefined) {
      conditions.push(eq(leadsTable.source, input.source));
    }

    if (input.high_intent !== undefined) {
      conditions.push(eq(leadsTable.high_intent, input.high_intent));
    }

    // Build query directly with all clauses
    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Execute query with all parts at once
    const results = await db.select()
      .from(leadsTable)
      .where(whereClause)
      .orderBy(desc(leadsTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    return results;
  } catch (error) {
    console.error('Get leads failed:', error);
    throw error;
  }
}
