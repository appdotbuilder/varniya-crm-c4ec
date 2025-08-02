
import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type UpdateOrderInput, type Order } from '../schema';
import { eq } from 'drizzle-orm';

export const updateOrder = async (input: UpdateOrderInput): Promise<Order> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.delivery_status !== undefined) {
      updateData.delivery_status = input.delivery_status;
    }
    if (input.payment_status !== undefined) {
      updateData.payment_status = input.payment_status;
    }
    if (input.order_status !== undefined) {
      updateData.order_status = input.order_status;
    }
    if (input.special_notes !== undefined) {
      updateData.special_notes = input.special_notes;
    }
    if (input.estimated_delivery !== undefined) {
      updateData.estimated_delivery = input.estimated_delivery;
    }
    if (input.actual_delivery !== undefined) {
      updateData.actual_delivery = input.actual_delivery;
    }

    // Update the order
    const result = await db.update(ordersTable)
      .set(updateData)
      .where(eq(ordersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Order with id ${input.id} not found`);
    }

    // Convert numeric price back to number
    const order = result[0];
    return {
      ...order,
      price: parseFloat(order.price)
    };
  } catch (error) {
    console.error('Order update failed:', error);
    throw error;
  }
};
