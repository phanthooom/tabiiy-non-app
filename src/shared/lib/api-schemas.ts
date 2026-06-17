import { z } from 'zod'
// ── Envelope ────────────────────────────────────────────────────────────────
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
})
export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  total_count: z.number().int().nonnegative(),
  has_next: z.boolean(),
  has_prev: z.boolean(),
})
export function apiEnvelopeSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema.nullable(),
    error: apiErrorSchema.nullable(),
    meta: z.union([paginationMetaSchema, z.record(z.string(), z.unknown())]).nullable().optional(),
  })
}
// ── Domain schemas ──────────────────────────────────────────────────────────
export const orderItemSchema = z.object({
  product_name: z.string(),
  quantity: z.number().int(),
  unit_price: z.number(),
  subtotal: z.number(),
})
export const orderSchema = z.object({
  id: z.number().int(),
  status: z.string(),
  status_label: z.string(),
  delivery_type: z.enum(['delivery', 'pickup']),
  address: z.string().nullable(),
  total_amount: z.number(),
  created_at: z.string(),
  items: z.array(orderItemSchema),
  yandex_claim_id: z.string().nullable(),
})
export const paginatedOrdersSchema = z.object({
  items: z.array(orderSchema),
  meta: paginationMetaSchema,
})
export const productSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  name_uz: z.string(),
  name_ru: z.string(),
  price: z.number(),
  quantity: z.number().int(),
  photo_file_id: z.string().nullable(),
  image_url: z.string().nullable(),
  is_available: z.boolean(),
  description: z.string().nullable().optional(),
  description_uz: z.string().nullable().optional(),
  description_ru: z.string().nullable().optional(),
})
export const cartItemSchema = z.object({
  product_id: z.number().int(),
  product_name: z.string(),
  price: z.number(),
  quantity: z.number().int(),
  subtotal: z.number(),
  photo_file_id: z.string().nullable(),
  image_url: z.string().nullable(),
})
export const cartSchema = z.object({
  items: z.array(cartItemSchema),
  total: z.number(),
  items_count: z.number().int(),
})
export const userProfileSchema = z.object({
  id: z.number().int(),
  full_name: z.string(),
  username: z.string().nullable(),
  phone: z.string().nullable(),
  language: z.enum(['ru', 'uz']),
})
export const authResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
  user_id: z.number().int(),
  full_name: z.string(),
  language: z.enum(['ru', 'uz']),
})
export class SchemaValidationError extends Error {
  constructor(message = 'Invalid API response format') {
    super(message)
    this.name = 'SchemaValidationError'
  }
}
export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    console.error(`[API schema] ${label} validation failed`, result.error.flatten())
    throw new SchemaValidationError(`${label}: unexpected response format`)
  }
  return result.data
}
