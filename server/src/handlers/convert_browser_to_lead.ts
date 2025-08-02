
import { db } from '../db';
import { leadsTable, browsersTable } from '../db/schema';
import { type CreateLeadInput, type Lead } from '../schema';
import { eq } from 'drizzle-orm';

export async function convertBrowserToLead(browserId: number, leadInput: CreateLeadInput): Promise<Lead> {
  try {
    // First, verify the browser exists and hasn't already been converted
    const browser = await db.select()
      .from(browsersTable)
      .where(eq(browsersTable.id, browserId))
      .execute();

    if (browser.length === 0) {
      throw new Error('Browser session not found');
    }

    if (browser[0].converted_to_lead) {
      throw new Error('Browser session has already been converted to a lead');
    }

    // Calculate lead score based on browser high_intent_score
    // Base score is 25 since we're converting from browser (high intent behavior)
    const baseScore = 25;
    const browserScore = browser[0].high_intent_score || 0;
    const finalScore = Math.min(100, baseScore + browserScore);

    // Create the lead with high_intent set to true and boosted score
    const leadResult = await db.insert(leadsTable)
      .values({
        phone: leadInput.phone,
        email: leadInput.email,
        name: leadInput.name,
        stage: leadInput.stage,
        medium: leadInput.medium,
        source: leadInput.source,
        high_intent: true, // Always true for converted browsers
        request_type: leadInput.request_type,
        urgency: leadInput.urgency,
        special_date: leadInput.special_date,
        occasion: leadInput.occasion,
        assigned_agent_id: leadInput.assigned_agent_id,
        lead_score: finalScore
      })
      .returning()
      .execute();

    const newLead = leadResult[0];

    // Update browser to mark as converted and link to the new lead
    await db.update(browsersTable)
      .set({
        converted_to_lead: true,
        lead_id: newLead.id
      })
      .where(eq(browsersTable.id, browserId))
      .execute();

    return newLead;
  } catch (error) {
    console.error('Browser to lead conversion failed:', error);
    throw error;
  }
}
