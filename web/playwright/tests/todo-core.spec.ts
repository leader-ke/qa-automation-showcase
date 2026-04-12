/**
 * Web UI layer: Core todo flows
 *
 * Strategy: UI tests sit at the top of the pyramid — they are the most
 * expensive to run and maintain, so they focus exclusively on critical
 * user journeys. Edge cases and validation live at the API layer.
 *
 * Risk focus: the flows that, if broken, would immediately block a user.
 * Target: https://demo.playwright.dev/todomvc
 */
import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';
import { todoItems, singleTodo } from '../../../fixtures/todos';

test.describe('Todo — core user journeys', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('user can add a todo item', async () => {
    await todoPage.addTodo(singleTodo.text);

    await todoPage.expectTodoCount(1);
    await todoPage.expectTodoVisible(singleTodo.text);
  });

  test('user can add multiple todo items', async () => {
    const texts = todoItems.map(t => t.text);
    await todoPage.addTodos(texts);

    await todoPage.expectTodoCount(texts.length);
  });

  test('user can complete a todo item', async () => {
    await todoPage.addTodo(singleTodo.text);
    await todoPage.completeTodo(singleTodo.text);

    const item = todoPage.page
      .getByTestId('todo-item')
      .filter({ hasText: singleTodo.text });
    await expect(item).toHaveClass(/completed/);
  });

  test('user can delete a todo item', async () => {
    await todoPage.addTodo(singleTodo.text);
    await todoPage.deleteTodo(singleTodo.text);

    await todoPage.expectTodoCount(0);
  });

  test('user can edit a todo item', async () => {
    const updatedText = 'Updated: ' + singleTodo.text;
    await todoPage.addTodo(singleTodo.text);
    await todoPage.editTodo(singleTodo.text, updatedText);

    await todoPage.expectTodoVisible(updatedText);
    await todoPage.expectTodoNotVisible(singleTodo.text);
  });

  test('active count decrements when a todo is completed', async () => {
    const texts = todoItems.slice(0, 3).map(t => t.text);
    await todoPage.addTodos(texts);
    await todoPage.expectActiveCount(3);

    await todoPage.completeTodo(texts[0]);
    await todoPage.expectActiveCount(2);
  });
});
