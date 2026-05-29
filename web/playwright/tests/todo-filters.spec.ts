/**
 * Web UI layer: Filtering
 *
 * Filtering is a distinct sub-journey with its own risk surface —
 * kept in a separate spec to isolate failures and keep each file focused.
 */
import { test } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';
import { todoItems } from '../../../fixtures/todos';

test.describe('Todo — filters', { tag: ['@regression'] }, () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();

    // Seed: add all fixture items, complete the ones marked completed
    for (const item of todoItems) {
      await todoPage.addTodo(item.text);
      if (item.completed) {
        await todoPage.completeTodo(item.text);
      }
    }
  });

  test('"Active" filter shows only incomplete items', async () => {
    await todoPage.filterBy('Active');

    const incomplete = todoItems.filter((t) => !t.completed);
    const completed = todoItems.filter((t) => t.completed);

    for (const item of incomplete) {
      await todoPage.expectTodoVisible(item.text);
    }
    for (const item of completed) {
      await todoPage.expectTodoNotVisible(item.text);
    }
  });

  test('"Completed" filter shows only completed items', async () => {
    await todoPage.filterBy('Completed');

    const incomplete = todoItems.filter((t) => !t.completed);
    const completed = todoItems.filter((t) => t.completed);

    for (const item of completed) {
      await todoPage.expectTodoVisible(item.text);
    }
    for (const item of incomplete) {
      await todoPage.expectTodoNotVisible(item.text);
    }
  });

  test('"All" filter shows every item', async () => {
    await todoPage.filterBy('All');

    await todoPage.expectTodoCount(todoItems.length);
  });

  test('"Clear completed" removes completed items', async () => {
    await todoPage.clearCompletedButton.click();

    const remaining = todoItems.filter((t) => !t.completed);
    await todoPage.expectTodoCount(remaining.length);

    for (const item of todoItems.filter((t) => t.completed)) {
      await todoPage.expectTodoNotVisible(item.text);
    }
  });
});
