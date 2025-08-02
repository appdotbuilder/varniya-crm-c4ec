
import { db } from '../db';
import { leadsTable, ordersTable, followUpActivitiesTable, browsersTable } from '../db/schema';
import { eq, and, count, sum, sql, gte, lt, SQL } from 'drizzle-orm';

export interface DashboardStats {
    totalLeads: number;
    activeDeals: number;
    completedSales: number;
    revenue: number;
    highIntentBrowsers: number;
    pendingFollowUps: number;
    leadsByStage: Record<string, number>;
    leadsBySource: Record<string, number>;
    salesByMonth: Array<{ month: string; sales: number; revenue: number }>;
}

export async function getDashboardStats(agentId?: number): Promise<DashboardStats> {
    try {
        // Get total leads count
        const totalLeadsConditions: SQL<unknown>[] = [];
        if (agentId) {
            totalLeadsConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const totalLeadsQuery = totalLeadsConditions.length > 0
            ? db.select({ count: count() }).from(leadsTable).where(and(...totalLeadsConditions))
            : db.select({ count: count() }).from(leadsTable);
        
        const totalLeadsResult = await totalLeadsQuery.execute();
        const totalLeads = totalLeadsResult[0]?.count || 0;

        // Get active deals (leads in genuine_lead stage)
        const activeDealsConditions: SQL<unknown>[] = [eq(leadsTable.stage, 'genuine_lead')];
        if (agentId) {
            activeDealsConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const activeDealsResult = await db.select({ count: count() })
            .from(leadsTable)
            .where(and(...activeDealsConditions))
            .execute();
        const activeDeals = activeDealsResult[0]?.count || 0;

        // Get completed sales (orders with delivered status)
        const completedSalesConditions: SQL<unknown>[] = [eq(ordersTable.order_status, 'delivered')];
        if (agentId) {
            completedSalesConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const completedSalesResult = await db.select({ count: count() })
            .from(ordersTable)
            .innerJoin(leadsTable, eq(ordersTable.lead_id, leadsTable.id))
            .where(and(...completedSalesConditions))
            .execute();
        const completedSales = completedSalesResult[0]?.count || 0;

        // Get total revenue from delivered orders
        const revenueConditions: SQL<unknown>[] = [eq(ordersTable.order_status, 'delivered')];
        if (agentId) {
            revenueConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const revenueResult = await db.select({ 
            total: sum(ordersTable.price) 
        })
            .from(ordersTable)
            .innerJoin(leadsTable, eq(ordersTable.lead_id, leadsTable.id))
            .where(and(...revenueConditions))
            .execute();
        const revenue = parseFloat(revenueResult[0]?.total || '0');

        // Get high intent browsers count (global metric, not filtered by agent)
        const highIntentBrowsersResult = await db.select({ count: count() })
            .from(browsersTable)
            .where(gte(browsersTable.high_intent_score, 70))
            .execute();
        const highIntentBrowsers = highIntentBrowsersResult[0]?.count || 0;

        // Get pending follow-ups count
        const followUpConditions: SQL<unknown>[] = [eq(followUpActivitiesTable.completed, false)];
        if (agentId) {
            followUpConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const pendingFollowUpsResult = await db.select({ count: count() })
            .from(followUpActivitiesTable)
            .innerJoin(leadsTable, eq(followUpActivitiesTable.lead_id, leadsTable.id))
            .where(and(...followUpConditions))
            .execute();
        const pendingFollowUps = pendingFollowUpsResult[0]?.count || 0;

        // Get leads by stage
        const stageFilterConditions: SQL<unknown>[] = [];
        if (agentId) {
            stageFilterConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const leadsByStageQuery = stageFilterConditions.length > 0
            ? db.select({
                stage: leadsTable.stage,
                count: count()
            })
                .from(leadsTable)
                .where(and(...stageFilterConditions))
                .groupBy(leadsTable.stage)
            : db.select({
                stage: leadsTable.stage,
                count: count()
            })
                .from(leadsTable)
                .groupBy(leadsTable.stage);

        const leadsByStageResult = await leadsByStageQuery.execute();
        const leadsByStage: Record<string, number> = {};
        leadsByStageResult.forEach(row => {
            leadsByStage[row.stage] = row.count;
        });

        // Get leads by source
        const sourceFilterConditions: SQL<unknown>[] = [];
        if (agentId) {
            sourceFilterConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const leadsBySourceQuery = sourceFilterConditions.length > 0
            ? db.select({
                source: leadsTable.source,
                count: count()
            })
                .from(leadsTable)
                .where(and(...sourceFilterConditions))
                .groupBy(leadsTable.source)
            : db.select({
                source: leadsTable.source,
                count: count()
            })
                .from(leadsTable)
                .groupBy(leadsTable.source);

        const leadsBySourceResult = await leadsBySourceQuery.execute();
        const leadsBySource: Record<string, number> = {};
        leadsBySourceResult.forEach(row => {
            leadsBySource[row.source] = row.count;
        });

        // Get sales by month (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const salesConditions: SQL<unknown>[] = [
            eq(ordersTable.order_status, 'delivered'),
            gte(ordersTable.created_at, sixMonthsAgo)
        ];
        if (agentId) {
            salesConditions.push(eq(leadsTable.assigned_agent_id, agentId));
        }
        
        const salesByMonthResult = await db.select({
            month: sql<string>`TO_CHAR(${ordersTable.created_at}, 'YYYY-MM')`,
            sales: count(),
            revenue: sum(ordersTable.price)
        })
            .from(ordersTable)
            .innerJoin(leadsTable, eq(ordersTable.lead_id, leadsTable.id))
            .where(and(...salesConditions))
            .groupBy(sql`TO_CHAR(${ordersTable.created_at}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${ordersTable.created_at}, 'YYYY-MM')`)
            .execute();

        const salesByMonth = salesByMonthResult.map(row => ({
            month: row.month,
            sales: row.sales,
            revenue: parseFloat(row.revenue || '0')
        }));

        return {
            totalLeads,
            activeDeals,
            completedSales,
            revenue,
            highIntentBrowsers,
            pendingFollowUps,
            leadsByStage,
            leadsBySource,
            salesByMonth
        };
    } catch (error) {
        console.error('Dashboard stats retrieval failed:', error);
        throw error;
    }
}
