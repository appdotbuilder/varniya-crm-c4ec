
import { db } from '../db';
import { browsersTable } from '../db/schema';
import { type Browser } from '../schema';
import { gte, desc } from 'drizzle-orm';

export async function getBrowsers(highIntentOnly: boolean = false): Promise<Browser[]> {
  try {
    let results;

    if (highIntentOnly) {
      // Query with high intent filter
      results = await db.select()
        .from(browsersTable)
        .where(gte(browsersTable.high_intent_score, 50))
        .orderBy(
          desc(browsersTable.high_intent_score),
          desc(browsersTable.last_activity)
        )
        .execute();
    } else {
      // Query without filter
      results = await db.select()
        .from(browsersTable)
        .orderBy(
          desc(browsersTable.high_intent_score),
          desc(browsersTable.last_activity)
        )
        .execute();
    }

    // Convert data types as needed
    return results.map(browser => ({
      ...browser,
      // actions is already stored as jsonb, so it should be parsed correctly
      actions: Array.isArray(browser.actions) ? browser.actions : []
    }));
  } catch (error) {
    console.error('Failed to fetch browsers:', error);
    throw error;
  }
}
