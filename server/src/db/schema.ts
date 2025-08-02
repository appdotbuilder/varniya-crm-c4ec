
import { serial, text, pgTable, timestamp, numeric, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const leadStageEnum = pgEnum('lead_stage', ['raw_lead', 'in_contact', 'not_interested', 'no_response', 'junk', 'genuine_lead']);
export const leadStatusEnum = pgEnum('lead_status', ['first_call_done', 'estimates_shared', 'disqualified']);
export const followUpStatusEnum = pgEnum('follow_up_status', ['follow_up', 'gone_cold', 'sale_completed']);
export const mediumEnum = pgEnum('medium', ['wati', 'phone', 'email', 'website', 'social_media', 'other']);
export const sourceEnum = pgEnum('source', ['google', 'meta', 'seo', 'organic', 'direct_unknown', 'referral']);
export const requestTypeEnum = pgEnum('request_type', ['product_enquiry', 'request_for_information', 'suggestions', 'other']);
export const urgencyEnum = pgEnum('urgency', ['1_week', '2_weeks', '3_weeks', '1_month', '3_months', 'no_urgency']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'in_production', 'ready_for_delivery', 'delivered', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'partial', 'paid', 'refunded']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['not_started', 'in_transit', 'delivered', 'failed']);
export const userRoleEnum = pgEnum('user_role', ['marketing', 'operations', 'sales', 'sales_agent', 'customer_service']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  active: boolean('active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Leads table
export const leadsTable = pgTable('leads', {
  id: serial('id').primaryKey(),
  phone: text('phone'),
  email: text('email'),
  name: text('name'),
  stage: leadStageEnum('stage').notNull(),
  status: leadStatusEnum('status'),
  follow_up_status: followUpStatusEnum('follow_up_status'),
  medium: mediumEnum('medium').notNull(),
  source: sourceEnum('source').notNull(),
  high_intent: boolean('high_intent').default(false).notNull(),
  request_type: requestTypeEnum('request_type').notNull(),
  urgency: urgencyEnum('urgency'),
  special_date: timestamp('special_date'),
  occasion: text('occasion'),
  assigned_agent_id: integer('assigned_agent_id'),
  lead_score: integer('lead_score').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  last_contact_at: timestamp('last_contact_at'),
});

// Lead notes table
export const leadNotesTable = pgTable('lead_notes', {
  id: serial('id').primaryKey(),
  lead_id: integer('lead_id').notNull(),
  agent_id: integer('agent_id').notNull(),
  note: text('note').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Follow-up activities table
export const followUpActivitiesTable = pgTable('follow_up_activities', {
  id: serial('id').primaryKey(),
  lead_id: integer('lead_id').notNull(),
  agent_id: integer('agent_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  scheduled_at: timestamp('scheduled_at').notNull(),
  completed: boolean('completed').default(false).notNull(),
  completed_at: timestamp('completed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Orders table
export const ordersTable = pgTable('orders', {
  id: serial('id').primaryKey(),
  lead_id: integer('lead_id').notNull(),
  product_type: text('product_type').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  special_notes: text('special_notes'),
  delivery_status: deliveryStatusEnum('delivery_status').default('not_started').notNull(),
  payment_status: paymentStatusEnum('payment_status').default('pending').notNull(),
  order_status: orderStatusEnum('order_status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  estimated_delivery: timestamp('estimated_delivery'),
  actual_delivery: timestamp('actual_delivery'),
});

// Browsers table (for Nitro Analytics integration)
export const browsersTable = pgTable('browsers', {
  id: serial('id').primaryKey(),
  session_id: text('session_id').notNull().unique(),
  user_agent: text('user_agent'),
  ip_address: text('ip_address'),
  pages_visited: integer('pages_visited').default(0).notNull(),
  time_spent: integer('time_spent').default(0).notNull(), // in seconds
  actions: jsonb('actions').default([]).notNull(), // array of actions
  high_intent_score: integer('high_intent_score').default(0).notNull(),
  converted_to_lead: boolean('converted_to_lead').default(false).notNull(),
  lead_id: integer('lead_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  last_activity: timestamp('last_activity').defaultNow().notNull(),
});

// Configuration table for system settings
export const configurationsTable = pgTable('configurations', {
  id: serial('id').primaryKey(),
  config_type: text('config_type').notNull(), // 'lead_stages', 'sources', etc.
  config_key: text('config_key').notNull(),
  config_value: text('config_value').notNull(),
  display_order: integer('display_order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  assignedLeads: many(leadsTable),
  leadNotes: many(leadNotesTable),
  followUpActivities: many(followUpActivitiesTable),
}));

export const leadsRelations = relations(leadsTable, ({ one, many }) => ({
  assignedAgent: one(usersTable, {
    fields: [leadsTable.assigned_agent_id],
    references: [usersTable.id],
  }),
  notes: many(leadNotesTable),
  followUpActivities: many(followUpActivitiesTable),
  orders: many(ordersTable),
  browser: one(browsersTable, {
    fields: [leadsTable.id],
    references: [browsersTable.lead_id],
  }),
}));

export const leadNotesRelations = relations(leadNotesTable, ({ one }) => ({
  lead: one(leadsTable, {
    fields: [leadNotesTable.lead_id],
    references: [leadsTable.id],
  }),
  agent: one(usersTable, {
    fields: [leadNotesTable.agent_id],
    references: [usersTable.id],
  }),
}));

export const followUpActivitiesRelations = relations(followUpActivitiesTable, ({ one }) => ({
  lead: one(leadsTable, {
    fields: [followUpActivitiesTable.lead_id],
    references: [leadsTable.id],
  }),
  agent: one(usersTable, {
    fields: [followUpActivitiesTable.agent_id],
    references: [usersTable.id],
  }),
}));

export const ordersRelations = relations(ordersTable, ({ one }) => ({
  lead: one(leadsTable, {
    fields: [ordersTable.lead_id],
    references: [leadsTable.id],
  }),
}));

export const browsersRelations = relations(browsersTable, ({ one }) => ({
  convertedLead: one(leadsTable, {
    fields: [browsersTable.lead_id],
    references: [leadsTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  leads: leadsTable,
  leadNotes: leadNotesTable,
  followUpActivities: followUpActivitiesTable,
  orders: ordersTable,
  browsers: browsersTable,
  configurations: configurationsTable,
};
