
import { z } from 'zod';

// Enums for various configurable options
export const leadStageEnum = z.enum(['raw_lead', 'in_contact', 'not_interested', 'no_response', 'junk', 'genuine_lead']);
export const leadStatusEnum = z.enum(['first_call_done', 'estimates_shared', 'disqualified']);
export const followUpStatusEnum = z.enum(['follow_up', 'gone_cold', 'sale_completed']);
export const mediumEnum = z.enum(['wati', 'phone', 'email', 'website', 'social_media', 'other']);
export const sourceEnum = z.enum(['google', 'meta', 'seo', 'organic', 'direct_unknown', 'referral']);
export const requestTypeEnum = z.enum(['product_enquiry', 'request_for_information', 'suggestions', 'other']);
export const urgencyEnum = z.enum(['1_week', '2_weeks', '3_weeks', '1_month', '3_months', 'no_urgency']);
export const orderStatusEnum = z.enum(['pending', 'confirmed', 'in_production', 'ready_for_delivery', 'delivered', 'cancelled']);
export const paymentStatusEnum = z.enum(['pending', 'partial', 'paid', 'refunded']);
export const deliveryStatusEnum = z.enum(['not_started', 'in_transit', 'delivered', 'failed']);
export const userRoleEnum = z.enum(['marketing', 'operations', 'sales', 'sales_agent', 'customer_service']);

// Lead schema
export const leadSchema = z.object({
  id: z.number(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  stage: leadStageEnum,
  status: leadStatusEnum.nullable(),
  follow_up_status: followUpStatusEnum.nullable(),
  medium: mediumEnum,
  source: sourceEnum,
  high_intent: z.boolean().default(false),
  request_type: requestTypeEnum,
  urgency: urgencyEnum.nullable(),
  special_date: z.coerce.date().nullable(),
  occasion: z.string().nullable(),
  assigned_agent_id: z.number().nullable(),
  lead_score: z.number().default(0),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  last_contact_at: z.coerce.date().nullable()
});

export type Lead = z.infer<typeof leadSchema>;

// Lead note schema
export const leadNoteSchema = z.object({
  id: z.number(),
  lead_id: z.number(),
  agent_id: z.number(),
  note: z.string(),
  created_at: z.coerce.date()
});

export type LeadNote = z.infer<typeof leadNoteSchema>;

// Follow-up activity schema
export const followUpActivitySchema = z.object({
  id: z.number(),
  lead_id: z.number(),
  agent_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  scheduled_at: z.coerce.date(),
  completed: z.boolean().default(false),
  completed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type FollowUpActivity = z.infer<typeof followUpActivitySchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  lead_id: z.number(),
  product_type: z.string(),
  price: z.number(),
  quantity: z.number().int(),
  special_notes: z.string().nullable(),
  delivery_status: deliveryStatusEnum,
  payment_status: paymentStatusEnum,
  order_status: orderStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  estimated_delivery: z.coerce.date().nullable(),
  actual_delivery: z.coerce.date().nullable()
});

export type Order = z.infer<typeof orderSchema>;

// User/Agent schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: userRoleEnum,
  active: z.boolean().default(true),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Browser tracking schema (for Nitro Analytics integration)
export const browserSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  pages_visited: z.number().int().default(0),
  time_spent: z.number().default(0), // in seconds
  actions: z.array(z.string()).default([]), // cart_add, product_view, etc.
  high_intent_score: z.number().default(0),
  converted_to_lead: z.boolean().default(false),
  lead_id: z.number().nullable(),
  created_at: z.coerce.date(),
  last_activity: z.coerce.date()
});

export type Browser = z.infer<typeof browserSchema>;

// Configuration schemas
export const configurationSchema = z.object({
  id: z.number(),
  config_type: z.string(), // 'lead_stages', 'sources', 'mediums', etc.
  config_key: z.string(),
  config_value: z.string(),
  display_order: z.number().int().default(0),
  active: z.boolean().default(true),
  created_at: z.coerce.date()
});

export type Configuration = z.infer<typeof configurationSchema>;

// Input schemas for creating/updating entities
export const createLeadInputSchema = z.object({
  phone: z.string().nullable(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  stage: leadStageEnum.default('raw_lead'),
  medium: mediumEnum,
  source: sourceEnum,
  high_intent: z.boolean().default(false),
  request_type: requestTypeEnum,
  urgency: urgencyEnum.nullable(),
  special_date: z.coerce.date().nullable(),
  occasion: z.string().nullable(),
  assigned_agent_id: z.number().nullable()
});

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;

export const updateLeadInputSchema = z.object({
  id: z.number(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  stage: leadStageEnum.optional(),
  status: leadStatusEnum.nullable().optional(),
  follow_up_status: followUpStatusEnum.nullable().optional(),
  medium: mediumEnum.optional(),
  source: sourceEnum.optional(),
  high_intent: z.boolean().optional(),
  request_type: requestTypeEnum.optional(),
  urgency: urgencyEnum.nullable().optional(),
  special_date: z.coerce.date().nullable().optional(),
  occasion: z.string().nullable().optional(),
  assigned_agent_id: z.number().nullable().optional(),
  lead_score: z.number().optional()
});

export type UpdateLeadInput = z.infer<typeof updateLeadInputSchema>;

export const createLeadNoteInputSchema = z.object({
  lead_id: z.number(),
  agent_id: z.number(),
  note: z.string()
});

export type CreateLeadNoteInput = z.infer<typeof createLeadNoteInputSchema>;

export const createFollowUpInputSchema = z.object({
  lead_id: z.number(),
  agent_id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  scheduled_at: z.coerce.date()
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpInputSchema>;

export const createOrderInputSchema = z.object({
  lead_id: z.number(),
  product_type: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive(),
  special_notes: z.string().nullable(),
  estimated_delivery: z.coerce.date().nullable()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderInputSchema = z.object({
  id: z.number(),
  delivery_status: deliveryStatusEnum.optional(),
  payment_status: paymentStatusEnum.optional(),
  order_status: orderStatusEnum.optional(),
  special_notes: z.string().nullable().optional(),
  estimated_delivery: z.coerce.date().nullable().optional(),
  actual_delivery: z.coerce.date().nullable().optional()
});

export type UpdateOrderInput = z.infer<typeof updateOrderInputSchema>;

export const createBrowserInputSchema = z.object({
  session_id: z.string(),
  user_agent: z.string().nullable(),
  ip_address: z.string().nullable(),
  pages_visited: z.number().int().default(1),
  time_spent: z.number().default(0),
  actions: z.array(z.string()).default([])
});

export type CreateBrowserInput = z.infer<typeof createBrowserInputSchema>;

// Query input schemas
export const getLeadsInputSchema = z.object({
  stage: leadStageEnum.optional(),
  status: leadStatusEnum.optional(),
  follow_up_status: followUpStatusEnum.optional(),
  assigned_agent_id: z.number().optional(),
  source: sourceEnum.optional(),
  high_intent: z.boolean().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type GetLeadsInput = z.infer<typeof getLeadsInputSchema>;

export const getOrdersInputSchema = z.object({
  lead_id: z.number().optional(),
  order_status: orderStatusEnum.optional(),
  payment_status: paymentStatusEnum.optional(),
  delivery_status: deliveryStatusEnum.optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type GetOrdersInput = z.infer<typeof getOrdersInputSchema>;
