
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { browsersTable } from '../db/schema';
import { getBrowsers } from '../handlers/get_browsers';
import { type CreateBrowserInput } from '../schema';

const testBrowser1: CreateBrowserInput = {
  session_id: 'session_1',
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  ip_address: '192.168.1.1',
  pages_visited: 5,
  time_spent: 300,
  actions: ['product_view', 'cart_add']
};

const testBrowser2: CreateBrowserInput = {
  session_id: 'session_2',
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  ip_address: '192.168.1.2',
  pages_visited: 2,
  time_spent: 120,
  actions: ['product_view']
};

describe('getBrowsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all browsers ordered by high_intent_score desc, then last_activity desc', async () => {
    // Create test browsers with different high_intent_scores
    await db.insert(browsersTable).values([
      {
        ...testBrowser1,
        high_intent_score: 75,
        last_activity: new Date('2024-01-01T10:00:00Z')
      },
      {
        ...testBrowser2,
        high_intent_score: 25,
        last_activity: new Date('2024-01-01T12:00:00Z')
      }
    ]).execute();

    const result = await getBrowsers();

    expect(result).toHaveLength(2);
    
    // Verify ordering - first should have higher high_intent_score
    expect(result[0].high_intent_score).toBe(75);
    expect(result[1].high_intent_score).toBe(25);
    
    // Verify basic fields
    expect(result[0].session_id).toBe('session_1');
    expect(result[0].pages_visited).toBe(5);
    expect(result[0].time_spent).toBe(300);
    expect(result[0].actions).toEqual(['product_view', 'cart_add']);
    expect(result[0].converted_to_lead).toBe(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].last_activity).toBeInstanceOf(Date);
  });

  it('should filter by high intent score when highIntentOnly is true', async () => {
    // Create browsers with different high_intent_scores
    await db.insert(browsersTable).values([
      {
        ...testBrowser1,
        high_intent_score: 75 // Above threshold
      },
      {
        ...testBrowser2,
        high_intent_score: 25 // Below threshold
      }
    ]).execute();

    const result = await getBrowsers(true);

    expect(result).toHaveLength(1);
    expect(result[0].high_intent_score).toBe(75);
    expect(result[0].session_id).toBe('session_1');
  });

  it('should return empty array when no browsers exist', async () => {
    const result = await getBrowsers();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle browsers with same high_intent_score ordered by last_activity desc', async () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 60000); // 1 minute earlier

    await db.insert(browsersTable).values([
      {
        ...testBrowser1,
        high_intent_score: 50,
        last_activity: earlier
      },
      {
        ...testBrowser2,
        high_intent_score: 50,
        last_activity: now
      }
    ]).execute();

    const result = await getBrowsers();

    expect(result).toHaveLength(2);
    expect(result[0].high_intent_score).toBe(50);
    expect(result[1].high_intent_score).toBe(50);
    
    // First result should have more recent last_activity
    expect(result[0].last_activity.getTime()).toBeGreaterThan(result[1].last_activity.getTime());
  });

  it('should handle empty actions array correctly', async () => {
    await db.insert(browsersTable).values({
      session_id: 'session_empty',
      user_agent: 'Test Agent',
      ip_address: '127.0.0.1',
      pages_visited: 1,
      time_spent: 60,
      actions: []
    }).execute();

    const result = await getBrowsers();

    expect(result).toHaveLength(1);
    expect(result[0].actions).toEqual([]);
    expect(Array.isArray(result[0].actions)).toBe(true);
  });
});
