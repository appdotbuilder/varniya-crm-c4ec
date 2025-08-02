
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { leadsTable } from '../db/schema';
import { handleWatiWebhook, type WatiWebhookPayload } from '../handlers/webhook_wati';
import { eq } from 'drizzle-orm';

// Test webhook payload
const testPayload: WatiWebhookPayload = {
    phone: '+1234567890',
    name: 'John Doe',
    message: 'Hi, I am interested in your products',
    timestamp: '2024-01-01T10:00:00Z'
};

describe('handleWatiWebhook', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should create a new lead from WATI webhook', async () => {
        const result = await handleWatiWebhook(testPayload);

        // Verify lead fields
        expect(result.phone).toEqual('+1234567890');
        expect(result.name).toEqual('John Doe');
        expect(result.email).toBeNull();
        expect(result.stage).toEqual('raw_lead');
        expect(result.medium).toEqual('wati');
        expect(result.source).toEqual('direct_unknown');
        expect(result.high_intent).toEqual(false);
        expect(result.request_type).toEqual('product_enquiry');
        expect(result.urgency).toBeNull();
        expect(result.special_date).toBeNull();
        expect(result.occasion).toBeNull();
        expect(result.assigned_agent_id).toBeNull();
        expect(result.lead_score).toEqual(20);
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeInstanceOf(Date);
        expect(result.updated_at).toBeInstanceOf(Date);
        expect(result.last_contact_at).toBeInstanceOf(Date);
    });

    it('should save lead to database', async () => {
        const result = await handleWatiWebhook(testPayload);

        // Query database to verify lead was saved
        const leads = await db.select()
            .from(leadsTable)
            .where(eq(leadsTable.id, result.id))
            .execute();

        expect(leads).toHaveLength(1);
        expect(leads[0].phone).toEqual('+1234567890');
        expect(leads[0].name).toEqual('John Doe');
        expect(leads[0].medium).toEqual('wati');
        expect(leads[0].lead_score).toEqual(20);
        expect(leads[0].last_contact_at).toBeInstanceOf(Date);
    });

    it('should update existing lead instead of creating duplicate', async () => {
        // Create initial lead
        const firstResult = await handleWatiWebhook(testPayload);
        const firstContactTime = firstResult.last_contact_at;

        // Ensure we have a valid timestamp
        expect(firstContactTime).not.toBeNull();
        expect(firstContactTime).toBeInstanceOf(Date);

        // Wait a moment to ensure timestamp difference
        await new Promise(resolve => setTimeout(resolve, 10));

        // Process same phone number again
        const updatedPayload = {
            ...testPayload,
            message: 'Follow up message'
        };
        const secondResult = await handleWatiWebhook(updatedPayload);

        // Should return same lead ID but updated timestamps
        expect(secondResult.id).toEqual(firstResult.id);
        expect(secondResult.phone).toEqual(firstResult.phone);
        expect(secondResult.name).toEqual(firstResult.name);
        expect(secondResult.last_contact_at).not.toBeNull();
        expect(secondResult.last_contact_at).toBeInstanceOf(Date);
        
        // Compare timestamps - both should be defined at this point
        if (secondResult.last_contact_at && firstContactTime) {
            expect(secondResult.last_contact_at.getTime()).toBeGreaterThan(firstContactTime.getTime());
        }

        // Verify only one lead exists in database
        const allLeads = await db.select()
            .from(leadsTable)
            .where(eq(leadsTable.phone, testPayload.phone))
            .execute();

        expect(allLeads).toHaveLength(1);
        expect(allLeads[0].id).toEqual(firstResult.id);
    });

    it('should handle webhook with minimal data', async () => {
        const minimalPayload: WatiWebhookPayload = {
            phone: '+9876543210',
            timestamp: '2024-01-01T10:00:00Z'
        };

        const result = await handleWatiWebhook(minimalPayload);

        expect(result.phone).toEqual('+9876543210');
        expect(result.name).toBeNull();
        expect(result.stage).toEqual('raw_lead');
        expect(result.medium).toEqual('wati');
        expect(result.source).toEqual('direct_unknown');
        expect(result.lead_score).toEqual(20);
        expect(result.last_contact_at).toBeInstanceOf(Date);
    });

    it('should handle webhook with empty name', async () => {
        const payloadWithEmptyName: WatiWebhookPayload = {
            phone: '+1111111111',
            name: '',
            timestamp: '2024-01-01T10:00:00Z'
        };

        const result = await handleWatiWebhook(payloadWithEmptyName);

        expect(result.phone).toEqual('+1111111111');
        expect(result.name).toBeNull(); // Empty string should be converted to null
        expect(result.medium).toEqual('wati');
        expect(result.lead_score).toEqual(20);
    });
});
