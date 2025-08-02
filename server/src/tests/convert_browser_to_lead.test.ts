
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { browsersTable, leadsTable } from '../db/schema';
import { type CreateLeadInput } from '../schema';
import { convertBrowserToLead } from '../handlers/convert_browser_to_lead';
import { eq } from 'drizzle-orm';

const testBrowserInput = {
  session_id: 'test-session-123',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ip_address: '192.168.1.1',
  pages_visited: 5,
  time_spent: 300,
  actions: ['product_view', 'cart_add'],
  high_intent_score: 25
};

const testLeadInput: CreateLeadInput = {
  phone: '+1234567890',
  email: 'test@example.com',
  name: 'Test Lead',
  stage: 'raw_lead',
  medium: 'website',
  source: 'organic',
  high_intent: false,
  request_type: 'product_enquiry',
  urgency: '1_week',
  special_date: null,
  occasion: null,
  assigned_agent_id: null
};

describe('convertBrowserToLead', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should convert browser session to lead', async () => {
    // Create test browser session
    const browserResult = await db.insert(browsersTable)
      .values(testBrowserInput)
      .returning()
      .execute();
    const browser = browserResult[0];

    const result = await convertBrowserToLead(browser.id, testLeadInput);

    // Verify lead was created with correct data
    expect(result.phone).toEqual('+1234567890');
    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test Lead');
    expect(result.stage).toEqual('raw_lead');
    expect(result.medium).toEqual('website');
    expect(result.source).toEqual('organic');
    expect(result.high_intent).toBe(true); // Should always be true for converted browsers
    expect(result.request_type).toEqual('product_enquiry');
    expect(result.urgency).toEqual('1_week');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should boost lead score based on browser high_intent_score', async () => {
    // Create browser with high intent score
    const browserResult = await db.insert(browsersTable)
      .values({
        ...testBrowserInput,
        high_intent_score: 40
      })
      .returning()
      .execute();
    const browser = browserResult[0];

    const result = await convertBrowserToLead(browser.id, testLeadInput);

    // Base score (25) + browser score (40) = 65
    expect(result.lead_score).toEqual(65);
  });

  it('should cap lead score at 100', async () => {
    // Create browser with very high intent score
    const browserResult = await db.insert(browsersTable)
      .values({
        ...testBrowserInput,
        high_intent_score: 80
      })
      .returning()
      .execute();
    const browser = browserResult[0];

    const result = await convertBrowserToLead(browser.id, testLeadInput);

    // Score should be capped at 100
    expect(result.lead_score).toEqual(100);
  });

  it('should update browser as converted and link to lead', async () => {
    // Create test browser session
    const browserResult = await db.insert(browsersTable)
      .values(testBrowserInput)
      .returning()
      .execute();
    const browser = browserResult[0];

    const result = await convertBrowserToLead(browser.id, testLeadInput);

    // Verify browser was updated
    const updatedBrowser = await db.select()
      .from(browsersTable)
      .where(eq(browsersTable.id, browser.id))
      .execute();

    expect(updatedBrowser).toHaveLength(1);
    expect(updatedBrowser[0].converted_to_lead).toBe(true);
    expect(updatedBrowser[0].lead_id).toEqual(result.id);
  });

  it('should save lead to database', async () => {
    // Create test browser session
    const browserResult = await db.insert(browsersTable)
      .values(testBrowserInput)
      .returning()
      .execute();
    const browser = browserResult[0];

    const result = await convertBrowserToLead(browser.id, testLeadInput);

    // Verify lead was saved to database
    const leads = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, result.id))
      .execute();

    expect(leads).toHaveLength(1);
    expect(leads[0].phone).toEqual('+1234567890');
    expect(leads[0].high_intent).toBe(true);
    expect(leads[0].lead_score).toEqual(50); // 25 + 25 from browser
  });

  it('should throw error for non-existent browser', async () => {
    await expect(convertBrowserToLead(999, testLeadInput))
      .rejects.toThrow(/browser session not found/i);
  });

  it('should throw error for already converted browser', async () => {
    // Create browser that's already converted
    const browserResult = await db.insert(browsersTable)
      .values({
        ...testBrowserInput,
        converted_to_lead: true,
        lead_id: 1
      })
      .returning()
      .execute();
    const browser = browserResult[0];

    await expect(convertBrowserToLead(browser.id, testLeadInput))
      .rejects.toThrow(/already been converted/i);
  });

  it('should handle browser with zero high_intent_score', async () => {
    // Create browser with zero intent score
    const browserResult = await db.insert(browsersTable)
      .values({
        ...testBrowserInput,
        high_intent_score: 0
      })
      .returning()
      .execute();
    const browser = browserResult[0];

    const result = await convertBrowserToLead(browser.id, testLeadInput);

    // Should get base score of 25 + 0 = 25
    expect(result.lead_score).toEqual(25);
  });
});
