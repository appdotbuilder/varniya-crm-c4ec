
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, leadsTable, ordersTable } from '../db/schema';
import { type GetOrdersInput, type CreateLeadInput, type CreateOrderInput } from '../schema';
import { getOrders } from '../handlers/get_orders';

// Test data setup
const testUser = {
  name: 'Test Agent',
  email: 'agent@test.com',
  role: 'sales_agent' as const
};

const testLead: CreateLeadInput = {
  phone: '+1234567890',
  email: 'lead@test.com',
  name: 'Test Lead',
  stage: 'genuine_lead',
  medium: 'phone',
  source: 'google',
  high_intent: true,
  request_type: 'product_enquiry',
  urgency: '1_week',
  special_date: null,
  occasion: null,
  assigned_agent_id: null
};

const testOrder: CreateOrderInput = {
  lead_id: 1, // Will be set after lead creation
  product_type: 'Wedding Cake',
  price: 299.99,
  quantity: 1,
  special_notes: 'Chocolate flavor with roses',
  estimated_delivery: new Date('2024-02-14')
};

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all orders with default pagination', async () => {
    // Create user first
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create lead
    const leadResult = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_agent_id: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    // Create order
    await db.insert(ordersTable)
      .values({
        ...testOrder,
        lead_id: leadId,
        price: testOrder.price.toString()
      })
      .execute();

    const input: GetOrdersInput = {
      limit: 50,
      offset: 0
    };

    const result = await getOrders(input);

    expect(result).toHaveLength(1);
    expect(result[0].lead_id).toEqual(leadId);
    expect(result[0].product_type).toEqual('Wedding Cake');
    expect(result[0].price).toEqual(299.99);
    expect(typeof result[0].price).toBe('number');
    expect(result[0].quantity).toEqual(1);
    expect(result[0].order_status).toEqual('pending');
    expect(result[0].payment_status).toEqual('pending');
    expect(result[0].delivery_status).toEqual('not_started');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter orders by lead_id', async () => {
    // Create user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create two leads
    const lead1Result = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_agent_id: userId,
        name: 'Lead 1'
      })
      .returning()
      .execute();
    const lead1Id = lead1Result[0].id;

    const lead2Result = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_agent_id: userId,
        name: 'Lead 2'
      })
      .returning()
      .execute();
    const lead2Id = lead2Result[0].id;

    // Create orders for both leads
    await db.insert(ordersTable)
      .values([
        {
          ...testOrder,
          lead_id: lead1Id,
          price: testOrder.price.toString(),
          product_type: 'Order for Lead 1'
        },
        {
          ...testOrder,
          lead_id: lead2Id,
          price: (testOrder.price + 100).toString(),
          product_type: 'Order for Lead 2'
        }
      ])
      .execute();

    const input: GetOrdersInput = {
      lead_id: lead1Id,
      limit: 50,
      offset: 0
    };

    const result = await getOrders(input);

    expect(result).toHaveLength(1);
    expect(result[0].lead_id).toEqual(lead1Id);
    expect(result[0].product_type).toEqual('Order for Lead 1');
    expect(result[0].price).toEqual(299.99);
  });

  it('should filter orders by order_status', async () => {
    // Create user and lead
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const leadResult = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_agent_id: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    // Create orders with different statuses
    await db.insert(ordersTable)
      .values([
        {
          ...testOrder,
          lead_id: leadId,
          price: testOrder.price.toString(),
          order_status: 'pending',
          product_type: 'Pending Order'
        },
        {
          ...testOrder,
          lead_id: leadId,
          price: testOrder.price.toString(),
          order_status: 'confirmed',
          product_type: 'Confirmed Order'
        }
      ])
      .execute();

    const input: GetOrdersInput = {
      order_status: 'confirmed',
      limit: 50,
      offset: 0
    };

    const result = await getOrders(input);

    expect(result).toHaveLength(1);
    expect(result[0].order_status).toEqual('confirmed');
    expect(result[0].product_type).toEqual('Confirmed Order');
  });

  it('should filter orders by payment_status and delivery_status', async () => {
    // Create user and lead
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const leadResult = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_agent_id: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    // Create orders with different payment and delivery statuses
    await db.insert(ordersTable)
      .values([
        {
          ...testOrder,
          lead_id: leadId,
          price: testOrder.price.toString(),
          payment_status: 'paid',
          delivery_status: 'delivered',
          product_type: 'Completed Order'
        },
        {
          ...testOrder,
          lead_id: leadId,
          price: testOrder.price.toString(),
          payment_status: 'pending',
          delivery_status: 'not_started',
          product_type: 'Pending Order'
        }
      ])
      .execute();

    const input: GetOrdersInput = {
      payment_status: 'paid',
      delivery_status: 'delivered',
      limit: 50,
      offset: 0
    };

    const result = await getOrders(input);

    expect(result).toHaveLength(1);
    expect(result[0].payment_status).toEqual('paid');
    expect(result[0].delivery_status).toEqual('delivered');
    expect(result[0].product_type).toEqual('Completed Order');
  });

  it('should apply pagination correctly', async () => {
    // Create user and lead
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const leadResult = await db.insert(leadsTable)
      .values({
        ...testLead,
        assigned_agent_id: userId
      })
      .returning()
      .execute();
    const leadId = leadResult[0].id;

    // Create 5 orders
    const orderValues = Array.from({ length: 5 }, (_, i) => ({
      ...testOrder,
      lead_id: leadId,
      price: (testOrder.price + i).toString(),
      product_type: `Order ${i + 1}`
    }));

    await db.insert(ordersTable)
      .values(orderValues)
      .execute();

    // Test first page
    const firstPageInput: GetOrdersInput = {
      limit: 2,
      offset: 0
    };

    const firstPageResult = await getOrders(firstPageInput);
    expect(firstPageResult).toHaveLength(2);

    // Test second page
    const secondPageInput: GetOrdersInput = {
      limit: 2,
      offset: 2
    };

    const secondPageResult = await getOrders(secondPageInput);
    expect(secondPageResult).toHaveLength(2);

    // Verify different results
    expect(firstPageResult[0].id).not.toEqual(secondPageResult[0].id);
  });

  it('should return empty array when no orders match filters', async () => {
    const input: GetOrdersInput = {
      lead_id: 999, // Non-existent lead
      limit: 50,
      offset: 0
    };

    const result = await getOrders(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
