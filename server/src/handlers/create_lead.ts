
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput, type Lead } from '../schema';

export const createLead = async (input: CreateLeadInput): Promise<Lead> => {
  try {
    // Calculate initial lead score based on business logic
    let leadScore = 0;
    
    // Base score for high intent leads
    if (input.high_intent) {
      leadScore += 50;
    } else {
      leadScore += 10;
    }
    
    // Source-based scoring
    switch (input.source) {
      case 'google':
      case 'meta':
        leadScore += 20;
        break;
      case 'seo':
      case 'organic':
        leadScore += 15;
        break;
      case 'referral':
        leadScore += 25;
        break;
      case 'direct_unknown':
        leadScore += 5;
        break;
    }
    
    // Request type scoring
    switch (input.request_type) {
      case 'product_enquiry':
        leadScore += 30;
        break;
      case 'request_for_information':
        leadScore += 20;
        break;
      case 'suggestions':
        leadScore += 10;
        break;
      case 'other':
        leadScore += 5;
        break;
    }

    // Insert lead record
    const result = await db.insert(leadsTable)
      .values({
        phone: input.phone,
        email: input.email,
        name: input.name,
        stage: input.stage,
        medium: input.medium,
        source: input.source,
        high_intent: input.high_intent,
        request_type: input.request_type,
        urgency: input.urgency,
        special_date: input.special_date,
        occasion: input.occasion,
        assigned_agent_id: input.assigned_agent_id,
        lead_score: leadScore
      })
      .returning()
      .execute();

    const lead = result[0];
    return {
      ...lead,
      // Convert the lead_score from database (which should be an integer) to number
      lead_score: Number(lead.lead_score)
    };
  } catch (error) {
    console.error('Lead creation failed:', error);
    throw error;
  }
};
