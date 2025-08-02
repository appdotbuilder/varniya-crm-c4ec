
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type GetOrdersInput, type Order } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getOrders(input: GetOrdersInput): Promise<Order[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input.lead_id !== undefined) {
      conditions.push(eq(ordersTable.lead_id, input.lead_id));
    }

    if (input.order_status !== undefined) {
      conditions.push(eq(ordersTable.order_status, input.order_status));
    }

    if (input.payment_status !== undefined) {
      conditions.push(eq(ordersTable.payment_status, input.payment_status));
    }

    if (input.delivery_status !== undefined) {
      conditions.push(eq(ordersTable.delivery_status, input.delivery_status));
    }

    // Build the complete query in one go
    const query = db.select()
      .from(ordersTable)
      .where(conditions.length > 0 
        ? (conditions.length === 1 ? conditions[0] : and(...conditions))
        : undefined
      )
      .limit(input.limit)
      .offset(input.offset);

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(order => ({
      ...order,
      price: parseFloat(order.price)
    }));
  } catch (error) {
    console.error('Get orders failed:', error);
    throw error;
  }
}
