
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, leadsTable, ordersTable, followUpActivitiesTable, browsersTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return empty stats when no data exists', async () => {
        const stats = await getDashboardStats();

        expect(stats.totalLeads).toBe(0);
        expect(stats.activeDeals).toBe(0);
        expect(stats.completedSales).toBe(0);
        expect(stats.revenue).toBe(0);
        expect(stats.highIntentBrowsers).toBe(0);
        expect(stats.pendingFollowUps).toBe(0);
        expect(stats.leadsByStage).toEqual({});
        expect(stats.leadsBySource).toEqual({});
        expect(stats.salesByMonth).toEqual([]);
    });

    it('should calculate dashboard stats correctly', async () => {
        // Create test user
        const userResult = await db.insert(usersTable)
            .values({
                name: 'Test Agent',
                email: 'agent@test.com',
                role: 'sales_agent'
            })
            .returning()
            .execute();
        const userId = userResult[0].id;

        // Create test leads
        const leadResults = await db.insert(leadsTable)
            .values([
                {
                    name: 'Lead 1',
                    stage: 'raw_lead',
                    medium: 'phone',
                    source: 'google',
                    request_type: 'product_enquiry',
                    assigned_agent_id: userId
                },
                {
                    name: 'Lead 2',
                    stage: 'genuine_lead',
                    medium: 'email',
                    source: 'meta',
                    request_type: 'product_enquiry',
                    assigned_agent_id: userId
                },
                {
                    name: 'Lead 3',
                    stage: 'genuine_lead',
                    medium: 'website',
                    source: 'seo',
                    request_type: 'product_enquiry'
                }
            ])
            .returning()
            .execute();

        const [lead1, lead2, lead3] = leadResults;

        // Create test orders
        await db.insert(ordersTable)
            .values([
                {
                    lead_id: lead2.id,
                    product_type: 'Custom Cake',
                    price: '299.99',
                    quantity: 1,
                    delivery_status: 'delivered',
                    payment_status: 'paid',
                    order_status: 'delivered'
                },
                {
                    lead_id: lead3.id,
                    product_type: 'Wedding Cake',
                    price: '599.99',
                    quantity: 1,
                    delivery_status: 'delivered',
                    payment_status: 'paid',
                    order_status: 'delivered'
                }
            ])
            .execute();

        // Create test follow-up activities
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await db.insert(followUpActivitiesTable)
            .values([
                {
                    lead_id: lead1.id,
                    agent_id: userId,
                    title: 'Follow up call',
                    scheduled_at: tomorrow,
                    completed: false
                },
                {
                    lead_id: lead2.id,
                    agent_id: userId,
                    title: 'Send estimate',
                    scheduled_at: tomorrow,
                    completed: true
                }
            ])
            .execute();

        // Create test browsers
        await db.insert(browsersTable)
            .values([
                {
                    session_id: 'session1',
                    high_intent_score: 80,
                    pages_visited: 5,
                    time_spent: 300
                },
                {
                    session_id: 'session2',
                    high_intent_score: 60,
                    pages_visited: 3,
                    time_spent: 180
                }
            ])
            .execute();

        const stats = await getDashboardStats();

        expect(stats.totalLeads).toBe(3);
        expect(stats.activeDeals).toBe(2);
        expect(stats.completedSales).toBe(2);
        expect(stats.revenue).toBe(899.98);
        expect(stats.highIntentBrowsers).toBe(1);
        expect(stats.pendingFollowUps).toBe(1);
        expect(stats.leadsByStage['raw_lead']).toBe(1);
        expect(stats.leadsByStage['genuine_lead']).toBe(2);
        expect(stats.leadsBySource['google']).toBe(1);
        expect(stats.leadsBySource['meta']).toBe(1);
        expect(stats.leadsBySource['seo']).toBe(1);
        expect(stats.salesByMonth.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter stats by agent ID', async () => {
        // Create test users
        const userResults = await db.insert(usersTable)
            .values([
                {
                    name: 'Agent 1',
                    email: 'agent1@test.com',
                    role: 'sales_agent'
                },
                {
                    name: 'Agent 2',
                    email: 'agent2@test.com',
                    role: 'sales_agent'
                }
            ])
            .returning()
            .execute();

        const [agent1, agent2] = userResults;

        // Create test leads for different agents
        const leadResults = await db.insert(leadsTable)
            .values([
                {
                    name: 'Agent 1 Lead 1',
                    stage: 'raw_lead',
                    medium: 'phone',
                    source: 'google',
                    request_type: 'product_enquiry',
                    assigned_agent_id: agent1.id
                },
                {
                    name: 'Agent 1 Lead 2',
                    stage: 'genuine_lead',
                    medium: 'email',
                    source: 'meta',
                    request_type: 'product_enquiry',
                    assigned_agent_id: agent1.id
                },
                {
                    name: 'Agent 2 Lead 1',
                    stage: 'genuine_lead',
                    medium: 'website',
                    source: 'seo',
                    request_type: 'product_enquiry',
                    assigned_agent_id: agent2.id
                }
            ])
            .returning()
            .execute();

        const [agent1Lead1, agent1Lead2, agent2Lead1] = leadResults;

        // Create orders for both agents
        await db.insert(ordersTable)
            .values([
                {
                    lead_id: agent1Lead2.id,
                    product_type: 'Custom Cake',
                    price: '299.99',
                    quantity: 1,
                    delivery_status: 'delivered',
                    payment_status: 'paid',
                    order_status: 'delivered'
                },
                {
                    lead_id: agent2Lead1.id,
                    product_type: 'Wedding Cake',
                    price: '599.99',
                    quantity: 1,
                    delivery_status: 'delivered',
                    payment_status: 'paid',
                    order_status: 'delivered'
                }
            ])
            .execute();

        // Create follow-up activities
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await db.insert(followUpActivitiesTable)
            .values([
                {
                    lead_id: agent1Lead1.id,
                    agent_id: agent1.id,
                    title: 'Follow up call',
                    scheduled_at: tomorrow,
                    completed: false
                },
                {
                    lead_id: agent2Lead1.id,
                    agent_id: agent2.id,
                    title: 'Send estimate',
                    scheduled_at: tomorrow,
                    completed: false
                }
            ])
            .execute();

        // Get stats for agent 1
        const agent1Stats = await getDashboardStats(agent1.id);

        expect(agent1Stats.totalLeads).toBe(2);
        expect(agent1Stats.activeDeals).toBe(1);
        expect(agent1Stats.completedSales).toBe(1);
        expect(agent1Stats.revenue).toBe(299.99);
        expect(agent1Stats.pendingFollowUps).toBe(1);
        expect(agent1Stats.leadsByStage['raw_lead']).toBe(1);
        expect(agent1Stats.leadsByStage['genuine_lead']).toBe(1);
        expect(agent1Stats.leadsBySource['google']).toBe(1);
        expect(agent1Stats.leadsBySource['meta']).toBe(1);

        // Get stats for agent 2
        const agent2Stats = await getDashboardStats(agent2.id);

        expect(agent2Stats.totalLeads).toBe(1);
        expect(agent2Stats.activeDeals).toBe(1);
        expect(agent2Stats.completedSales).toBe(1);
        expect(agent2Stats.revenue).toBe(599.99);
        expect(agent2Stats.pendingFollowUps).toBe(1);
        expect(agent2Stats.leadsByStage['genuine_lead']).toBe(1);
        expect(agent2Stats.leadsBySource['seo']).toBe(1);
    });

    it('should handle revenue calculation correctly', async () => {
        // Create test user and lead
        const userResult = await db.insert(usersTable)
            .values({
                name: 'Test Agent',
                email: 'agent@test.com',
                role: 'sales_agent'
            })
            .returning()
            .execute();

        const leadResult = await db.insert(leadsTable)
            .values({
                name: 'Test Lead',
                stage: 'genuine_lead',
                medium: 'phone',
                source: 'google',
                request_type: 'product_enquiry',
                assigned_agent_id: userResult[0].id
            })
            .returning()
            .execute();

        // Create orders with different statuses
        await db.insert(ordersTable)
            .values([
                {
                    lead_id: leadResult[0].id,
                    product_type: 'Delivered Order',
                    price: '199.99',
                    quantity: 1,
                    delivery_status: 'delivered',
                    payment_status: 'paid',
                    order_status: 'delivered'
                },
                {
                    lead_id: leadResult[0].id,
                    product_type: 'Pending Order',
                    price: '299.99',
                    quantity: 1,
                    delivery_status: 'not_started',
                    payment_status: 'pending',
                    order_status: 'pending'
                }
            ])
            .execute();

        const stats = await getDashboardStats();

        // Only delivered orders should count towards revenue
        expect(stats.completedSales).toBe(1);
        expect(stats.revenue).toBe(199.99);
    });
});
