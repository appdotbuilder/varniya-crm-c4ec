
import { db } from '../db';
import { leadsTable, usersTable, leadNotesTable, followUpActivitiesTable, ordersTable } from '../db/schema';
import { type Lead } from '../schema';
import { eq } from 'drizzle-orm';

export async function getLeadById(id: number): Promise<Lead | null> {
  try {
    // Get the lead with all its related data using joins
    const results = await db.select({
      // Lead fields
      id: leadsTable.id,
      phone: leadsTable.phone,
      email: leadsTable.email,
      name: leadsTable.name,
      stage: leadsTable.stage,
      status: leadsTable.status,
      follow_up_status: leadsTable.follow_up_status,
      medium: leadsTable.medium,
      source: leadsTable.source,
      high_intent: leadsTable.high_intent,
      request_type: leadsTable.request_type,
      urgency: leadsTable.urgency,
      special_date: leadsTable.special_date,
      occasion: leadsTable.occasion,
      assigned_agent_id: leadsTable.assigned_agent_id,
      lead_score: leadsTable.lead_score,
      created_at: leadsTable.created_at,
      updated_at: leadsTable.updated_at,
      last_contact_at: leadsTable.last_contact_at,
    })
    .from(leadsTable)
    .where(eq(leadsTable.id, id))
    .execute();

    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get lead by ID:', error);
    throw error;
  }
}
