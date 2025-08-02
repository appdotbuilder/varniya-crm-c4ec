
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { browsersTable } from '../db/schema';
import { type CreateBrowserInput } from '../schema';
import { createBrowser } from '../handlers/create_browser';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateBrowserInput = {
  session_id: 'test-session-123',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ip_address: '192.168.1.1',
  pages_visited: 3,
  time_spent: 120,
  actions: ['product_view', 'category_browse']
};

describe('createBrowser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a browser session', async () => {
    const result = await createBrowser(testInput);

    // Basic field validation
    expect(result.session_id).toEqual('test-session-123');
    expect(result.user_agent).toEqual(testInput.user_agent);
    expect(result.ip_address).toEqual('192.168.1.1');
    expect(result.pages_visited).toEqual(3);
    expect(result.time_spent).toEqual(120);
    expect(result.actions).toEqual(['product_view', 'category_browse']);
    expect(result.converted_to_lead).toEqual(false);
    expect(result.lead_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.last_activity).toBeInstanceOf(Date);
  });

  it('should calculate high intent score correctly', async () => {
    const result = await createBrowser(testInput);

    // Expected score: (3 pages * 2) + (1 product_view * 5) + (1 category_browse * 3) = 6 + 5 + 3 = 14
    expect(result.high_intent_score).toEqual(14);
  });

  it('should handle high-value actions in score calculation', async () => {
    const highIntentInput: CreateBrowserInput = {
      session_id: 'high-intent-session',
      user_agent: 'Test Browser',
      ip_address: '192.168.1.2',
      pages_visited: 5,
      time_spent: 300,
      actions: ['cart_add', 'search', 'product_view', 'product_view']
    };

    const result = await createBrowser(highIntentInput);

    // Expected score: (5 pages * 2) + (1 cart_add * 30) + (1 search * 8) + (2 product_view * 5) = 10 + 30 + 8 + 10 = 58
    expect(result.high_intent_score).toEqual(58);
  });

  it('should cap high intent score at 100', async () => {
    const maxScoreInput: CreateBrowserInput = {
      session_id: 'max-score-session',
      user_agent: 'Test Browser',
      ip_address: '192.168.1.3',
      pages_visited: 20,
      time_spent: 1000,
      actions: Array(20).fill('cart_add') // 20 cart_add actions should exceed 100
    };

    const result = await createBrowser(maxScoreInput);

    expect(result.high_intent_score).toEqual(100);
  });

  it('should save browser session to database', async () => {
    const result = await createBrowser(testInput);

    // Query using proper drizzle syntax
    const browsers = await db.select()
      .from(browsersTable)
      .where(eq(browsersTable.id, result.id))
      .execute();

    expect(browsers).toHaveLength(1);
    expect(browsers[0].session_id).toEqual('test-session-123');
    expect(browsers[0].user_agent).toEqual(testInput.user_agent);
    expect(browsers[0].pages_visited).toEqual(3);
    expect(browsers[0].time_spent).toEqual(120);
    expect(browsers[0].actions).toEqual(['product_view', 'category_browse']);
    expect(browsers[0].high_intent_score).toEqual(14);
    expect(browsers[0].converted_to_lead).toEqual(false);
    expect(browsers[0].lead_id).toBeNull();
    expect(browsers[0].created_at).toBeInstanceOf(Date);
    expect(browsers[0].last_activity).toBeInstanceOf(Date);
  });

  it('should handle minimal input with defaults', async () => {
    const minimalInput: CreateBrowserInput = {
      session_id: 'minimal-session',
      user_agent: null,
      ip_address: null,
      pages_visited: 1, // default from schema
      time_spent: 0, // default from schema
      actions: [] // default from schema
    };

    const result = await createBrowser(minimalInput);

    expect(result.session_id).toEqual('minimal-session');
    expect(result.user_agent).toBeNull();
    expect(result.ip_address).toBeNull();
    expect(result.pages_visited).toEqual(1);
    expect(result.time_spent).toEqual(0);
    expect(result.actions).toEqual([]);
    expect(result.high_intent_score).toEqual(2); // 1 page * 2 = 2
    expect(result.converted_to_lead).toEqual(false);
    expect(result.lead_id).toBeNull();
  });
});
