
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createLeadInputSchema,
  updateLeadInputSchema,
  getLeadsInputSchema,
  createLeadNoteInputSchema,
  createFollowUpInputSchema,
  createOrderInputSchema,
  updateOrderInputSchema,
  getOrdersInputSchema,
  createBrowserInputSchema
} from './schema';

// Import handlers
import { createLead } from './handlers/create_lead';
import { getLeads } from './handlers/get_leads';
import { updateLead } from './handlers/update_lead';
import { getLeadById } from './handlers/get_lead_by_id';
import { createLeadNote } from './handlers/create_lead_note';
import { getLeadNotes } from './handlers/get_lead_notes';
import { createFollowUp } from './handlers/create_follow_up';
import { getFollowUps } from './handlers/get_follow_ups';
import { completeFollowUp } from './handlers/complete_follow_up';
import { createOrder } from './handlers/create_order';
import { getOrders } from './handlers/get_orders';
import { updateOrder } from './handlers/update_order';
import { createBrowser } from './handlers/create_browser';
import { getBrowsers } from './handlers/get_browsers';
import { convertBrowserToLead } from './handlers/convert_browser_to_lead';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getUsers } from './handlers/get_users';
import { handleWatiWebhook, type WatiWebhookPayload } from './handlers/webhook_wati';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Lead management
  createLead: publicProcedure
    .input(createLeadInputSchema)
    .mutation(({ input }) => createLead(input)),

  getLeads: publicProcedure
    .input(getLeadsInputSchema)
    .query(({ input }) => getLeads(input)),

  updateLead: publicProcedure
    .input(updateLeadInputSchema)
    .mutation(({ input }) => updateLead(input)),

  getLeadById: publicProcedure
    .input(z.number())
    .query(({ input }) => getLeadById(input)),

  // Lead notes
  createLeadNote: publicProcedure
    .input(createLeadNoteInputSchema)
    .mutation(({ input }) => createLeadNote(input)),

  getLeadNotes: publicProcedure
    .input(z.number())
    .query(({ input }) => getLeadNotes(input)),

  // Follow-up activities
  createFollowUp: publicProcedure
    .input(createFollowUpInputSchema)
    .mutation(({ input }) => createFollowUp(input)),

  getFollowUps: publicProcedure
    .input(z.object({
      agentId: z.number().optional(),
      leadId: z.number().optional()
    }))
    .query(({ input }) => getFollowUps(input.agentId, input.leadId)),

  completeFollowUp: publicProcedure
    .input(z.number())
    .mutation(({ input }) => completeFollowUp(input)),

  // Order management
  createOrder: publicProcedure
    .input(createOrderInputSchema)
    .mutation(({ input }) => createOrder(input)),

  getOrders: publicProcedure
    .input(getOrdersInputSchema)
    .query(({ input }) => getOrders(input)),

  updateOrder: publicProcedure
    .input(updateOrderInputSchema)
    .mutation(({ input }) => updateOrder(input)),

  // Browser tracking (Nitro Analytics integration)
  createBrowser: publicProcedure
    .input(createBrowserInputSchema)
    .mutation(({ input }) => createBrowser(input)),

  getBrowsers: publicProcedure
    .input(z.object({ highIntentOnly: z.boolean().default(false) }))
    .query(({ input }) => getBrowsers(input.highIntentOnly)),

  convertBrowserToLead: publicProcedure
    .input(z.object({
      browserId: z.number(),
      leadInput: createLeadInputSchema
    }))
    .mutation(({ input }) => convertBrowserToLead(input.browserId, input.leadInput)),

  // Dashboard and analytics
  getDashboardStats: publicProcedure
    .input(z.object({ agentId: z.number().optional() }))
    .query(({ input }) => getDashboardStats(input.agentId)),

  // User management
  getUsers: publicProcedure
    .input(z.object({ role: z.string().optional() }))
    .query(({ input }) => getUsers(input.role)),

  // Webhook endpoints
  watiWebhook: publicProcedure
    .input(z.object({
      phone: z.string(),
      name: z.string().optional(),
      message: z.string().optional(),
      timestamp: z.string()
    }))
    .mutation(({ input }) => handleWatiWebhook(input as WatiWebhookPayload)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Varniya CRM TRPC server listening at port: ${port}`);
}

start();
