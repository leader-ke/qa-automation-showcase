/**
 * API layer: Todos
 *
 * Validates a resource with a boolean state field (`completed`).
 * Risk focus: boolean fields are frequently lost in serialisation,
 * type coercion bugs, or partial updates — worth explicit coverage.
 */
import { test, expect } from '@playwright/test';
import { newTodo, completedTodo } from '../../fixtures/todos-api';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('Todos API', { tag: ['@regression'] }, () => {
  test.describe('GET /todos', () => {
    test('returns 200 with a non-empty list', { tag: '@smoke' }, async ({ request }) => {
      const response = await request.get(`${BASE_URL}/todos`);

      expect(response.status()).toBe(200);
      const todos = await response.json();
      expect(todos.length).toBeGreaterThan(0);
    });

    test('each todo has required fields with correct types', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/todos`);
      const todos = await response.json();

      for (const todo of todos) {
        expect(typeof todo.id).toBe('number');
        expect(typeof todo.userId).toBe('number');
        expect(typeof todo.title).toBe('string');
        expect(typeof todo.completed).toBe('boolean');
      }
    });

    test('list contains both completed and incomplete todos', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/todos`);
      const todos = await response.json();

      const hasCompleted = todos.some((t: { completed: boolean }) => t.completed === true);
      const hasIncomplete = todos.some((t: { completed: boolean }) => t.completed === false);

      expect(hasCompleted).toBe(true);
      expect(hasIncomplete).toBe(true);
    });
  });

  test.describe('GET /todos?completed=', () => {
    test('filters to only completed todos', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/todos?completed=true`);

      expect(response.status()).toBe(200);
      const todos = await response.json();
      expect(todos.length).toBeGreaterThan(0);

      for (const todo of todos) {
        expect(todo.completed).toBe(true);
      }
    });

    test('filters to only incomplete todos', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/todos?completed=false`);

      expect(response.status()).toBe(200);
      const todos = await response.json();
      expect(todos.length).toBeGreaterThan(0);

      for (const todo of todos) {
        expect(todo.completed).toBe(false);
      }
    });
  });

  test.describe('POST /todos', () => {
    test('creates an incomplete todo and returns 201', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/todos`, { data: newTodo });

      expect(response.status()).toBe(201);
      const created = await response.json();
      expect(created.title).toBe(newTodo.title);
      expect(created.completed).toBe(false);
      expect(created.userId).toBe(newTodo.userId);
    });

    test('creates a completed todo and preserves completed=true', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/todos`, { data: completedTodo });

      expect(response.status()).toBe(201);
      const created = await response.json();
      expect(created.completed).toBe(true);
    });
  });

  test.describe('PATCH /todos/:id', () => {
    test('marks an incomplete todo as completed', async ({ request }) => {
      const response = await request.patch(`${BASE_URL}/todos/1`, {
        data: { completed: true },
      });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.completed).toBe(true);
    });
  });
});
