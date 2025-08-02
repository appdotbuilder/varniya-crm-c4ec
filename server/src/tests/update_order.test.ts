
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, leadsTable, usersTable } from '../db/schema';
import { type UpdateOrderInput } from '../schema';
import { updateOrder } from '../handlers/update_order';
import { eq } from 'drizzle-orm';

describe('updateOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOrderId: number;
  let testLeadId: number;

  beforeEach(async () => {
    // Create test user first
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    // Create test lead
    const leadResult = await db.insert(leadsTable)
      .values({
        name: 'Test Lead',
        phone: '1234567890',
        email: 'lead@test.com',
        stage: 'genuine_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry',
        assigned_agent_id: userResult[0].id
      })
      .returning()
      .execute();

    testLeadId = leadResult[0].id;

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        lead_id: testLeadId,
        product_type: 'Custom Cake',
        price: '150.00',
        quantity: 1,
        special_notes: 'Original notes'
      })
      .returning()
      .execute();

    testOrderId = orderResult[0].id;
  });

  it('should update order status fields', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      order_status: 'confirmed',
      payment_status: 'paid',
      delivery_status: 'in_transit'
    };

    const result = await updateOrder(input);

    expect(result.id).toEqual(testOrderId);
    expect(result.order_status).toEqual('confirmed');
    expect(result.payment_status).toEqual('paid');
    expect(result.delivery_status).toEqual('in_transit');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.price).toEqual(150.00);
    expect(typeof result.price).toBe('number');
  });

  it('should update special notes and delivery dates', async () => {
    const estimatedDelivery = new Date('2024-12-25');
    const actualDelivery = new Date('2024-12-24');

    const input: UpdateOrderInput = {
      id: testOrderId,
      special_notes: 'Updated notes with special instructions',
      estimated_delivery: estimatedDelivery,
      actual_delivery: actualDelivery
    };

    const result = await updateOrder(input);

    expect(result.special_notes).toEqual('Updated notes with special instructions');
    expect(result.estimated_delivery).toEqual(estimatedDelivery);
    expect(result.actual_delivery).toEqual(actualDelivery);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      payment_status: 'partial'
    };

    const result = await updateOrder(input);

    // Updated field
    expect(result.payment_status).toEqual('partial');
    
    // Unchanged fields should retain original values
    expect(result.order_status).toEqual('pending');
    expect(result.delivery_status).toEqual('not_started');
    expect(result.special_notes).toEqual('Original notes');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      order_status: 'delivered',
      delivery_status: 'delivered',
      actual_delivery: new Date('2024-12-20')
    };

    await updateOrder(input);

    // Verify changes were persisted
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, testOrderId))
      .execute();

    expect(orders).toHaveLength(1);
    const savedOrder = orders[0];
    expect(savedOrder.order_status).toEqual('delivered');
    expect(savedOrder.delivery_status).toEqual('delivered');
    expect(savedOrder.actual_delivery).toEqual(new Date('2024-12-20'));
    expect(savedOrder.updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp automatically', async () => {
    const beforeUpdate = new Date();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

    const input: UpdateOrderInput = {
      id: testOrderId,
      order_status: 'in_production'
    };

    const result = await updateOrder(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(beforeUpdate.getTime());
  });

  it('should handle null values correctly', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      special_notes: null,
      estimated_delivery: null,
      actual_delivery: null
    };

    const result = await updateOrder(input);

    expect(result.special_notes).toBeNull();
    expect(result.estimated_delivery).toBeNull();
    expect(result.actual_delivery).toBeNull();
  });

  it('should throw error for non-existent order', async () => {
    const input: UpdateOrderInput = {
      id: 99999,
      order_status: 'confirmed'
    };

    await expect(updateOrder(input)).rejects.toThrow(/not found/i);
  });
});
