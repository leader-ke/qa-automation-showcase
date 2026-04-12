/**
 * API layer: Posts — mutation operations (PUT, PATCH, DELETE)
 *
 * Mutation endpoints are a common regression surface: a schema change or
 * missing field can silently corrupt data. These tests validate that update
 * and delete operations return the correct status codes and reflect changes
 * in the response body.
 */
import { test, expect } from '@playwright/test';
import { validNewPost } from '../../fixtures/users';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('Posts API — mutations', () => {
  test.describe('PUT /posts/:id', () => {
    test('replaces a post and returns 200 with the full updated resource', async ({ request }) => {
      const updated = { id: 1, title: 'Replaced title', body: 'Replaced body', userId: 1 };
      const response = await request.put(`${BASE_URL}/posts/1`, { data: updated });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.id).toBe(1);
      expect(body.title).toBe(updated.title);
      expect(body.body).toBe(updated.body);
      expect(body.userId).toBe(updated.userId);
    });

    test('returns 200 even when replacing with minimal fields', async ({ request }) => {
      const response = await request.put(`${BASE_URL}/posts/1`, {
        data: { title: 'Minimal', body: 'Body', userId: 1 },
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('PATCH /posts/:id', () => {
    test('partially updates a post and returns 200', async ({ request }) => {
      const response = await request.patch(`${BASE_URL}/posts/1`, {
        data: { title: 'Patched title only' },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.title).toBe('Patched title only');
      // Other fields should still be present
      expect(body).toHaveProperty('body');
      expect(body).toHaveProperty('userId');
    });

    test('patching body only does not remove other fields', async ({ request }) => {
      const response = await request.patch(`${BASE_URL}/posts/1`, {
        data: { body: 'Only the body changed' },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.body).toBe('Only the body changed');
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('userId');
    });
  });

  test.describe('DELETE /posts/:id', () => {
    test('deletes a post and returns 200', async ({ request }) => {
      const response = await request.delete(`${BASE_URL}/posts/1`);

      expect(response.status()).toBe(200);
    });

    test('returns an empty object on successful delete', async ({ request }) => {
      const response = await request.delete(`${BASE_URL}/posts/1`);
      const body = await response.json();

      expect(body).toEqual({});
    });
  });
});
