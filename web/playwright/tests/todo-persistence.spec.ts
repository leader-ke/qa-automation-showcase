/**
 * Web UI layer: Persistence
 *
 * Data that disappears on reload is a silent, high-impact bug.
 * These tests confirm that todos survive a page reload — catching
 * regressions in localStorage writes or hydration logic.
 */
import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';
import { todoItems } from '../../../fixtures/todos';

test.describe('Todo — persistence', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('todos persist after page reload', async ({ page }) => {
    const texts = todoItems.slice(0, 3).map(t => t.text);
    await todoPage.addTodos(texts);

    await page.reload();

    await todoPage.expectTodoCount(3);
    for (const text of texts) {
      await todoPage.expectTodoVisible(text);
    }
  });

  test('completed state persists after page reload', async ({ page }) => {
    await todoPage.addTodo(todoItems[0].text);
    await todoPage.completeTodo(todoItems[0].text);

    await page.reload();

    const item = page
      .getByTestId('todo-item')
      .filter({ hasText: todoItems[0].text });
    await expect(item).toHaveClass(/completed/);
  });

  test('active filter selection persists after reload', async ({ page }) => {
    await todoPage.addTodo(todoItems[0].text);
    await todoPage.filterBy('Active');

    await page.reload();

    await expect(page.getByRole('link', { name: 'Active' })).toHaveClass(/selected/);
  });
});
