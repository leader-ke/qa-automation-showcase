/**
 * API layer: Posts
 *
 * Covers CRUD operations at the API level — validating that create, read,
 * and filter flows work correctly without touching the UI.
 * Risk focus: data mutation endpoints and filter correctness.
 */
import { test, expect } from '@playwright/test';
import { validNewPost } from '../../fixtures/users';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('Posts API', () => {
  test.describe('GET /posts', () => {
    test('returns 200 with a non-empty list', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/posts`);

      expect(response.status()).toBe(200);
      const posts = await response.json();
      expect(posts.length).toBeGreaterThan(0);
    });

    test('each post has required fields with correct types', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/posts`);
      const posts = await response.json();

      for (const post of posts) {
        expect(typeof post.id).toBe('number');
        expect(typeof post.userId).toBe('number');
        expect(typeof post.title).toBe('string');
        expect(typeof post.body).toBe('string');
        expect(post.title.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('GET /posts?userId=', () => {
    test('filters posts by userId', async ({ request }) => {
      const userId = 1;
      const response = await request.get(`${BASE_URL}/posts?userId=${userId}`);

      expect(response.status()).toBe(200);
      const posts = await response.json();
      expect(posts.length).toBeGreaterThan(0);

      for (const post of posts) {
        expect(post.userId).toBe(userId);
      }
    });

    test('returns empty array for userId with no posts', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/posts?userId=99999`);

      expect(response.status()).toBe(200);
      const posts = await response.json();
      expect(posts).toEqual([]);
    });
  });

  test.describe('POST /posts', () => {
    test('creates a new post and returns 201 with the created resource', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/posts`, {
        data: validNewPost,
      });

      expect(response.status()).toBe(201);
      const created = await response.json();
      expect(created.id).toBeDefined();
      expect(created.title).toBe(validNewPost.title);
      expect(created.body).toBe(validNewPost.body);
      expect(created.userId).toBe(validNewPost.userId);
    });

    test('response Content-Type is application/json', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/posts`, {
        data: validNewPost,
      });

      expect(response.headers()['content-type']).toContain('application/json');
    });
  });

  test.describe('GET /posts/:id', () => {
    test('returns a single post by ID', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/posts/1`);

      expect(response.status()).toBe(200);
      const post = await response.json();
      expect(post.id).toBe(1);
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('body');
    });

    test('returns 404 for non-existent post', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/posts/99999`);

      expect(response.status()).toBe(404);
    });
  });
});
