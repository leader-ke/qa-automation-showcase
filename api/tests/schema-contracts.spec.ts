/**
 * API layer: Schema contract validation
 *
 * These tests validate the *shape* of API responses — not just that a field
 * exists, but that it satisfies the structural contract: correct types,
 * required fields present, valid formats (e.g. email), non-empty where required.
 *
 * Why this is a separate spec:
 * The other API tests (todos.spec.ts, posts.spec.ts, users.spec.ts) validate
 * *behaviour* — status codes, filtering, mutations. Schema validation is a
 * cross-cutting concern that sits one level below: it verifies the
 * *representation* contract that all other tests depend on.
 *
 * If a schema contract test fails, it usually means:
 * - A serialisation change dropped or renamed a field
 * - A type coercion bug changed a boolean to a string or null
 * - A new required field was added to the schema but not to the response
 */
import { test, expect } from '@playwright/test';
import { TodoSchema, PostSchema, UserSchema, assertConformsTo } from '../schemas';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('Schema contracts', { tag: ['@regression'] }, () => {
  // -------------------------------------------------------------------------
  // Todos
  // -------------------------------------------------------------------------

  test.describe('Todo schema', () => {
    test('every item in GET /todos conforms to the Todo schema', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/todos`);
      expect(response.status()).toBe(200);

      const todos = await response.json();
      expect(todos.length).toBeGreaterThan(0);

      for (const todo of todos) {
        // assertConformsTo throws with field-level detail if validation fails
        assertConformsTo(TodoSchema, todo, `todo[${todo?.id}]`);
      }
    });

    test('GET /todos/:id returns a valid Todo', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/todos/1`);
      const todo = await response.json();

      const result = TodoSchema.safeParse(todo);
      expect(
        result.success,
        result.success ? '' : JSON.stringify(result.error.issues, null, 2)
      ).toBe(true);
    });

    test('completed field is strictly boolean — not truthy string or number', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/todos?completed=true`);
      const todos = await response.json();

      for (const todo of todos) {
        // Strict check: must be exactly true, not "true", 1, or "1"
        expect(todo.completed).toBe(true);
        expect(typeof todo.completed).toBe('boolean');
      }
    });
  });

  // -------------------------------------------------------------------------
  // Posts
  // -------------------------------------------------------------------------

  test.describe('Post schema', () => {
    test('every item in GET /posts conforms to the Post schema', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/posts`);
      expect(response.status()).toBe(200);

      const posts = await response.json();
      expect(posts.length).toBeGreaterThan(0);

      for (const post of posts) {
        assertConformsTo(PostSchema, post, `post[${post?.id}]`);
      }
    });

    test('GET /posts/:id returns a valid Post', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/posts/1`);
      const post = await response.json();

      const result = PostSchema.safeParse(post);
      expect(
        result.success,
        result.success ? '' : JSON.stringify(result.error.issues, null, 2)
      ).toBe(true);
    });

    test('POST /posts — created resource conforms to Post schema', async ({ request }) => {
      const payload = { title: 'Schema test post', body: 'Body content', userId: 1 };
      const response = await request.post(`${BASE_URL}/posts`, { data: payload });

      expect(response.status()).toBe(201);
      const created = await response.json();

      // POST returns the resource with an id assigned
      const result = PostSchema.safeParse(created);
      expect(
        result.success,
        result.success ? '' : JSON.stringify(result.error.issues, null, 2)
      ).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Users  (most complex schema — nested objects, email validation)
  // -------------------------------------------------------------------------

  test.describe('User schema', () => {
    test('every item in GET /users conforms to the User schema', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users`);
      expect(response.status()).toBe(200);

      const users = await response.json();
      expect(users.length).toBeGreaterThan(0);

      for (const user of users) {
        // User schema includes nested address + geo + company — one call validates all
        assertConformsTo(UserSchema, user, `user[${user?.id}]`);
      }
    });

    test('email fields are valid email addresses', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users`);
      const users = await response.json();

      for (const user of users) {
        // Zod's z.string().email() validates RFC 5322 format
        const result = UserSchema.shape.email.safeParse(user.email);
        expect(
          result.success,
          `user[${user.id}].email "${user.email}" failed email validation`
        ).toBe(true);
      }
    });

    test('nested address.geo has lat/lng as strings (JSONPlaceholder quirk)', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/users/1`);
      const user = await response.json();

      // Geo coordinates are stored as strings — a quirk worth asserting explicitly
      expect(typeof user.address.geo.lat).toBe('string');
      expect(typeof user.address.geo.lng).toBe('string');
    });
  });
});
