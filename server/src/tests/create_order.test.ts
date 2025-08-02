
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, leadsTable, usersTable } from '../db/schema';
import { type CreateOrderInput } from '../schema';
import { createOrder } from '../handlers/create_order';
import { eq } from 'drizzle-orm';

describe('createOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an order', async () => {
    // Create prerequisite user and lead
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    const lead = await db.insert(leadsTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '+1234567890',
        stage: 'genuine_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry',
        assigned_agent_id: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateOrderInput = {
      lead_id: lead[0].id,
      product_type: 'Custom Cake',
      price: 299.99,
      quantity: 2,
      special_notes: 'Birthday theme',
      estimated_delivery: new Date('2024-12-25')
    };

    const result = await createOrder(testInput);

    // Basic field validation
    expect(result.lead_id).toEqual(lead[0].id);
    expect(result.product_type).toEqual('Custom Cake');
    expect(result.price).toEqual(299.99);
    expect(typeof result.price).toBe('number');
    expect(result.quantity).toEqual(2);
    expect(result.special_notes).toEqual('Birthday theme');
    expect(result.delivery_status).toEqual('not_started');
    expect(result.payment_status).toEqual('pending');
    expect(result.order_status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.estimated_delivery).toBeInstanceOf(Date);
    expect(result.actual_delivery).toBeNull();
  });

  it('should save order to database', async () => {
    // Create prerequisite user and lead
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    const lead = await db.insert(leadsTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '+1234567890',
        stage: 'genuine_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry',
        assigned_agent_id: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateOrderInput = {
      lead_id: lead[0].id,
      product_type: 'Wedding Cake',
      price: 599.50,
      quantity: 1,
      special_notes: null,
      estimated_delivery: null
    };

    const result = await createOrder(testInput);

    // Query database to verify order was saved
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].lead_id).toEqual(lead[0].id);
    expect(orders[0].product_type).toEqual('Wedding Cake');
    expect(parseFloat(orders[0].price)).toEqual(599.50);
    expect(orders[0].quantity).toEqual(1);
    expect(orders[0].special_notes).toBeNull();
    expect(orders[0].estimated_delivery).toBeNull();
    expect(orders[0].created_at).toBeInstanceOf(Date);
  });

  it('should update lead follow_up_status to sale_completed', async () => {
    // Create prerequisite user and lead
    const user = await db.insert(usersTable)
      .values({
        name: 'Test Agent',
        email: 'agent@test.com',
        role: 'sales_agent'
      })
      .returning()
      .execute();

    const lead = await db.insert(leadsTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '+1234567890',
        stage: 'genuine_lead',
        medium: 'phone',
        source: 'google',
        request_type: 'product_enquiry',
        follow_up_status: 'follow_up',
        assigned_agent_id: user[0].id
      })
      .returning()
      .execute();

    const testInput: CreateOrderInput = {
      lead_id: lead[0].id,
      product_type: 'Cupcakes',
      price: 45.00,
      quantity: 12,
      special_notes: 'Chocolate flavor',
      estimated_delivery: new Date('2024-12-20')
    };

    await createOrder(testInput);

    // Verify lead's follow_up_status was updated
    const updatedLead = await db.select()
      .from(leadsTable)
      .where(eq(leadsTable.id, lead[0].id))
      .execute();

    expect(updatedLead).toHaveLength(1);
    expect(updatedLead[0].follow_up_status).toEqual('sale_completed');
    expect(updatedLead[0].updated_at).toBeInstanceOf(Date);
    expect(updatedLead[0].updated_at > lead[0].updated_at).toBe(true);
  });

  it('should throw error for non-existent lead', async () => {
    const testInput: CreateOrderInput = {
      lead_id: 99999, // Non-existent lead ID
      product_type: 'Test Product',
      price: 100.00,
      quantity: 1,
      special_notes: null,
      estimated_delivery: null
    };

    await expect(createOrder(testInput)).rejects.toThrow(/Lead with id 99999 not found/i);
  });
});
