
import { db } from '../db';
import { ordersTable, leadsTable } from '../db/schema';
import { type CreateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const createOrder = async (input: CreateOrderInput): Promise<Order> => {
  try {
    // First verify that the lead exists
    const existingLead = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, input.lead_id))
      .execute();

    if (existingLead.length === 0) {
      throw new Error(`Lead with id ${input.lead_id} not found`);
    }

    // Insert order record
    const result = await db.insert(ordersTable)
      .values({
        lead_id: input.lead_id,
        product_type: input.product_type,
        price: input.price.toString(), // Convert number to string for numeric column
        quantity: input.quantity,
        special_notes: input.special_notes,
        estimated_delivery: input.estimated_delivery
      })
      .returning()
      .execute();

    // Update lead's follow_up_status to 'sale_completed'
    await db.update(leadsTable)
      .set({
        follow_up_status: 'sale_completed',
        updated_at: new Date()
      })
      .where(eq(leadsTable.id, input.lead_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    const order = result[0];
    return {
      ...order,
      price: parseFloat(order.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
};
