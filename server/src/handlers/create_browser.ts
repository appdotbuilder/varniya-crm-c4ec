
import { db } from '../db';
import { browsersTable } from '../db/schema';
import { type CreateBrowserInput, type Browser } from '../schema';

export const createBrowser = async (input: CreateBrowserInput): Promise<Browser> => {
  try {
    // Calculate initial high_intent_score based on actions and pages_visited
    const calculateHighIntentScore = (actions: string[], pagesVisited: number): number => {
      let score = pagesVisited * 2; // Base score from page visits
      
      // Boost score based on specific actions
      actions.forEach(action => {
        switch (action) {
          case 'cart_add': score += 30; break;
          case 'product_view': score += 5; break;
          case 'category_browse': score += 3; break;
          case 'search': score += 8; break;
          default: score += 1;
        }
      });
      
      return Math.min(score, 100); // Cap at 100
    };

    const highIntentScore = calculateHighIntentScore(input.actions, input.pages_visited);

    // Insert browser record
    const result = await db.insert(browsersTable)
      .values({
        session_id: input.session_id,
        user_agent: input.user_agent,
        ip_address: input.ip_address,
        pages_visited: input.pages_visited,
        time_spent: input.time_spent,
        actions: input.actions,
        high_intent_score: highIntentScore
      })
      .returning()
      .execute();

    // Type-cast the actions field to string[] since it's stored as jsonb but should be string[]
    const browser = result[0];
    return {
      ...browser,
      actions: browser.actions as string[]
    };
  } catch (error) {
    console.error('Browser creation failed:', error);
    throw error;
  }
};
