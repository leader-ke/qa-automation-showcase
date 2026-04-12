/**
 * Web UI layer: Keyboard navigation and accessibility
 *
 * Keyboard-only usage is both an accessibility requirement and a signal
 * of overall interaction quality. If keyboard flows break, screen reader
 * and power-user flows break too.
 */
import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';
import { todoItems } from '../../fixtures/todos';

test.describe('Todo — keyboard navigation', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('can add a todo using only the keyboard', async () => {
    await todoPage.input.focus();
    await todoPage.input.type(todoItems[0].text);
    await todoPage.page.keyboard.press('Enter');

    await todoPage.expectTodoCount(1);
    await todoPage.expectTodoVisible(todoItems[0].text);
  });

  test('can add multiple todos using only the keyboard', async () => {
    for (const item of todoItems.slice(0, 3)) {
      await todoPage.input.focus();
      await todoPage.input.type(item.text);
      await todoPage.page.keyboard.press('Enter');
    }

    await todoPage.expectTodoCount(3);
  });

  test('input is focused on page load', async () => {
    await expect(todoPage.input).toBeFocused();
  });

  test('input is cleared and refocused after adding a todo', async () => {
    await todoPage.input.type(todoItems[0].text);
    await todoPage.page.keyboard.press('Enter');

    await expect(todoPage.input).toHaveValue('');
    await expect(todoPage.input).toBeFocused();
  });

  test('can complete a todo using Space on the checkbox', async ({ page }) => {
    await todoPage.addTodo(todoItems[0].text);

    const checkbox = page
      .getByTestId('todo-item')
      .filter({ hasText: todoItems[0].text })
      .getByRole('checkbox');

    await checkbox.focus();
    await page.keyboard.press('Space');

    await expect(
      page.getByTestId('todo-item').filter({ hasText: todoItems[0].text })
    ).toHaveClass(/completed/);
  });
});
