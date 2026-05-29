/**
 * API layer: Users
 *
 * Strategy: API tests sit below the UI in the test pyramid — they are fast,
 * stable, and cover contract validation, status codes, and data shape.
 * These tests run on every commit to catch backend regressions before
 * any UI tests are even needed.
 *
 * Target: https://jsonplaceholder.typicode.com (public REST API)
 */
import { test, expect } from '@playwright/test';
import { knownUsers } from '../../fixtures/users';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('Users API', { tag: ['@regression'] }, () => {
  test.describe('GET /users', () => {
    test('returns 200 with an array of users', { tag: '@smoke' }, async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });

    test('each user has required fields', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users`);
      const users = await response.json();

      for (const user of users) {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('username');
        expect(user).toHaveProperty('email');
        expect(typeof user.id).toBe('number');
        expect(typeof user.name).toBe('string');
        expect(user.email).toMatch(/@/);
      }
    });

    test('returns known users with correct data', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users`);
      const users = await response.json();

      for (const expected of knownUsers) {
        const actual = users.find((u: { id: number }) => u.id === expected.id);
        expect(actual).toBeDefined();
        expect(actual.name).toBe(expected.name);
        expect(actual.username).toBe(expected.username);
        expect(actual.email).toBe(expected.email);
      }
    });
  });

  test.describe('GET /users/:id', () => {
    test('returns a single user by ID', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users/1`);

      expect(response.status()).toBe(200);
      const user = await response.json();
      expect(user.id).toBe(1);
      expect(user.name).toBe('Leanne Graham');
    });

    test('returns 404 for a non-existent user', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users/99999`);

      expect(response.status()).toBe(404);
    });
  });

  test.describe('GET /users/:id/posts', () => {
    test('returns posts belonging to a user', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/users/1/posts`);

      expect(response.status()).toBe(200);
      const posts = await response.json();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);

      for (const post of posts) {
        expect(post.userId).toBe(1);
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('body');
      }
    });
  });
});
