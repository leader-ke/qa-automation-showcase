/**
 * Web UI layer: Edge cases and empty state
 *
 * Happy path tests tell you the feature works. Edge case tests tell you
 * it won't break under real usage. These cover the boundaries that users
 * hit and developers often miss.
 */
import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';
import { singleTodo } from '../../fixtures/todos';

test.describe('Todo — edge cases', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test.describe('empty state', () => {
    test('todo list and footer are not visible on initial load', async ({ page }) => {
      await expect(page.getByTestId('todo-item')).toHaveCount(0);
      await expect(page.locator('.footer')).not.toBeVisible();
    });

    test('footer reappears after adding a todo', async ({ page }) => {
      await todoPage.addTodo(singleTodo.text);
      await expect(page.locator('.footer')).toBeVisible();
    });

    test('footer disappears after deleting the last todo', async ({ page }) => {
      await todoPage.addTodo(singleTodo.text);
      await todoPage.deleteTodo(singleTodo.text);
      await expect(page.locator('.footer')).not.toBeVisible();
    });
  });

  test.describe('input validation', () => {
    test('pressing Enter on empty input does not add a todo', async () => {
      await todoPage.page.keyboard.press('Enter');
      await todoPage.expectTodoCount(0);
    });

    test('whitespace-only input does not add a todo', async () => {
      await todoPage.input.fill('   ');
      await todoPage.input.press('Enter');
      await todoPage.expectTodoCount(0);
    });

    test('pressing Escape during edit cancels and reverts text', async () => {
      await todoPage.addTodo(singleTodo.text);

      const item = todoPage.page.getByTestId('todo-item').filter({ hasText: singleTodo.text });
      await item.dblclick();
      const editInput = item.getByRole('textbox', { name: 'Edit' });
      await editInput.fill('This should be cancelled');
      await editInput.press('Escape');

      await todoPage.expectTodoVisible(singleTodo.text);
      await todoPage.expectTodoNotVisible('This should be cancelled');
    });
  });

  test.describe('bulk actions', () => {
    test('toggle all marks every item as completed', async ({ page }) => {
      await todoPage.addTodos(['Task one', 'Task two', 'Task three']);

      await page.getByLabel('Mark all as complete').click();

      const items = page.getByTestId('todo-item');
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(items.nth(i)).toHaveClass(/completed/);
      }
    });

    test('toggle all again unchecks all completed items', async ({ page }) => {
      await todoPage.addTodos(['Task one', 'Task two']);
      const toggleAll = page.getByLabel('Mark all as complete');

      await toggleAll.click(); // complete all
      await toggleAll.click(); // uncomplete all

      const items = page.getByTestId('todo-item');
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(items.nth(i)).not.toHaveClass(/completed/);
      }
    });
  });
});
