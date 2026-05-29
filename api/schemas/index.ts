/**
 * API contract schemas — Zod
 *
 * These schemas define the *contract* between this test suite and the API.
 * They go beyond `typeof field === 'string'` — they assert structural
 * invariants: required fields, valid shapes, non-empty strings, valid enums.
 *
 * Why Zod over manual assertions?
 * - A single schema validates the entire shape in one call
 * - `safeParse` returns structured error messages that point to the exact
 *   field and violation, making failures fast to diagnose
 * - TypeScript types are inferred from the schema — one source of truth
 * - Schemas are composable: UserSchema reuses AddressSchema
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Todo
// ---------------------------------------------------------------------------

export const TodoSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  title: z.string().min(1, 'title must not be empty'),
  completed: z.boolean(),
});

export type Todo = z.infer<typeof TodoSchema>;

// ---------------------------------------------------------------------------
// Post
// ---------------------------------------------------------------------------

export const PostSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  title: z.string().min(1, 'title must not be empty'),
  body: z.string(),
});

export type Post = z.infer<typeof PostSchema>;

// ---------------------------------------------------------------------------
// User  (nested objects demonstrate schema composition)
// ---------------------------------------------------------------------------

const GeoSchema = z.object({
  lat: z.string(),
  lng: z.string(),
});

const AddressSchema = z.object({
  street: z.string(),
  suite: z.string(),
  city: z.string(),
  zipcode: z.string(),
  geo: GeoSchema,
});

const CompanySchema = z.object({
  name: z.string(),
  catchPhrase: z.string(),
  bs: z.string(),
});

export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email('email must be a valid email address'),
  address: AddressSchema,
  phone: z.string(),
  website: z.string(),
  company: CompanySchema,
});

export type User = z.infer<typeof UserSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Asserts a value conforms to a schema, throwing a descriptive error if not.
 * Use in tests where you want a hard failure with full Zod error output.
 */
export function assertConformsTo<T>(schema: z.ZodType<T>, value: unknown, label = 'value'): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`${label} does not conform to schema:\n${issues}`);
  }
  return result.data;
}
