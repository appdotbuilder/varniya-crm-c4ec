
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type UpdateLeadInput, type Lead } from '../schema';
import { eq } from 'drizzle-orm';

export const updateLead = async (input: UpdateLeadInput): Promise<Lead> => {
  try {
    // Validate that the lead exists
    const existingLead = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, input.id))
      .execute();

    if (existingLead.length === 0) {
      throw new Error(`Lead with id ${input.id} not found`);
    }

    const current = existingLead[0];

    // Validate stage transitions - prevent going backwards from completed states
    if (input.stage && current.follow_up_status === 'sale_completed') {
      if (['raw_lead', 'in_contact', 'not_interested', 'no_response', 'junk'].includes(input.stage)) {
        throw new Error('Cannot change stage of completed sale');
      }
    }

    // Calculate lead score based on updated fields
    let leadScore = current.lead_score;
    
    // Recalculate if relevant fields are being updated
    if (input.high_intent !== undefined || input.stage !== undefined || input.urgency !== undefined) {
      leadScore = 0;
      
      // High intent adds significant score
      const highIntent = input.high_intent !== undefined ? input.high_intent : current.high_intent;
      if (highIntent) leadScore += 30;
      
      // Stage scoring
      const stage = input.stage || current.stage;
      switch (stage) {
        case 'genuine_lead': leadScore += 40; break;
        case 'in_contact': leadScore += 20; break;
        case 'raw_lead': leadScore += 10; break;
        case 'not_interested':
        case 'no_response':
        case 'junk': leadScore += 0; break;
      }
      
      // Urgency scoring
      const urgency = input.urgency !== undefined ? input.urgency : current.urgency;
      switch (urgency) {
        case '1_week': leadScore += 20; break;
        case '2_weeks': leadScore += 15; break;
        case '3_weeks': leadScore += 10; break;
        case '1_month': leadScore += 5; break;
        case '3_months': leadScore += 2; break;
        case 'no_urgency': leadScore += 0; break;
      }
    }

    // Build update data, filtering out undefined values
    const updateData: any = {
      updated_at: new Date(),
      lead_score: leadScore
    };

    // Only include fields that are explicitly provided
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.stage !== undefined) updateData.stage = input.stage;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.follow_up_status !== undefined) updateData.follow_up_status = input.follow_up_status;
    if (input.medium !== undefined) updateData.medium = input.medium;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.high_intent !== undefined) updateData.high_intent = input.high_intent;
    if (input.request_type !== undefined) updateData.request_type = input.request_type;
    if (input.urgency !== undefined) updateData.urgency = input.urgency;
    if (input.special_date !== undefined) updateData.special_date = input.special_date;
    if (input.occasion !== undefined) updateData.occasion = input.occasion;
    if (input.assigned_agent_id !== undefined) updateData.assigned_agent_id = input.assigned_agent_id;

    // Update the lead
    const result = await db.update(leadsTable)
      .set(updateData)
      .where(eq(leadsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Lead update failed:', error);
    throw error;
  }
};
