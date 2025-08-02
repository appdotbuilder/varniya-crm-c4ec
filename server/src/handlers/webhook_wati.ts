
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { type CreateLeadInput, type Lead } from '../schema';
import { eq } from 'drizzle-orm';

export interface WatiWebhookPayload {
    phone: string;
    name?: string;
    message?: string;
    timestamp: string;
    // Add other WATI webhook fields as needed
}

export async function handleWatiWebhook(payload: WatiWebhookPayload): Promise<Lead> {
    try {
        // Check if a lead with this phone number already exists
        const existingLeads = await db.select()
            .from(leadsTable)
            .where(eq(leadsTable.phone, payload.phone))
            .execute();

        if (existingLeads.length > 0) {
            // Update existing lead's last_contact_at and updated_at
            const existingLead = existingLeads[0];
            const updatedLeads = await db.update(leadsTable)
                .set({
                    last_contact_at: new Date(),
                    updated_at: new Date()
                })
                .where(eq(leadsTable.id, existingLead.id))
                .returning()
                .execute();

            // Convert numeric fields and return updated lead
            const updatedLead = updatedLeads[0];
            return {
                ...updatedLead,
                lead_score: updatedLead.lead_score // Already integer, no conversion needed
            };
        }

        // Create new lead input with WATI webhook data
        const leadInput: CreateLeadInput = {
            phone: payload.phone,
            name: payload.name || null,
            email: null,
            stage: 'raw_lead',
            medium: 'wati',
            source: 'direct_unknown', // Could be enhanced to parse source from message content
            high_intent: false,
            request_type: 'product_enquiry', // Default, could be enhanced with NLP
            urgency: null,
            special_date: null,
            occasion: null,
            assigned_agent_id: null
        };

        // Insert new lead
        const result = await db.insert(leadsTable)
            .values({
                phone: leadInput.phone,
                name: leadInput.name,
                email: leadInput.email,
                stage: leadInput.stage,
                medium: leadInput.medium,
                source: leadInput.source,
                high_intent: leadInput.high_intent,
                request_type: leadInput.request_type,
                urgency: leadInput.urgency,
                special_date: leadInput.special_date,
                occasion: leadInput.occasion,
                assigned_agent_id: leadInput.assigned_agent_id,
                lead_score: 20, // Default score for WATI leads
                last_contact_at: new Date() // Set to now since they just contacted via WhatsApp
            })
            .returning()
            .execute();

        // Return the created lead (no numeric conversions needed for this table)
        return result[0];
    } catch (error) {
        console.error('WATI webhook processing failed:', error);
        throw error;
    }
}
