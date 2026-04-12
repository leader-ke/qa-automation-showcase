/**
 * Page Object Model: TodoPage
 *
 * Encapsulates all interactions with the TodoMVC UI.
 * Tests interact with this class rather than selectors directly —
 * if the UI changes, only this file needs updating, not every test.
 */
import { type Page, type Locator, expect } from '@playwright/test';

export class TodoPage {
  readonly page: Page;
  readonly input: Locator;
  readonly todoList: Locator;
  readonly activeCount: Locator;
  readonly clearCompletedButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByPlaceholder('What needs to be done?');
    this.todoList = page.getByTestId('todo-item');
    this.activeCount = page.getByTestId('todo-count');
    this.clearCompletedButton = page.getByRole('button', { name: 'Clear completed' });
  }

  async goto() {
    await this.page.goto('https://demo.playwright.dev/todomvc');
  }

  async addTodo(text: string) {
    await this.input.fill(text);
    await this.input.press('Enter');
  }

  async addTodos(items: string[]) {
    for (const item of items) {
      await this.addTodo(item);
    }
  }

  async completeTodo(text: string) {
    await this.page
      .getByTestId('todo-item')
      .filter({ hasText: text })
      .getByRole('checkbox')
      .check();
  }

  async deleteTodo(text: string) {
    const item = this.page.getByTestId('todo-item').filter({ hasText: text });
    await item.hover();
    await item.getByRole('button', { name: 'Delete' }).click();
  }

  async editTodo(oldText: string, newText: string) {
    const item = this.page.getByTestId('todo-item').filter({ hasText: oldText });
    await item.dblclick();
    const editInput = item.getByRole('textbox', { name: 'Edit' });
    await editInput.fill(newText);
    await editInput.press('Enter');
  }

  async filterBy(filter: 'All' | 'Active' | 'Completed') {
    await this.page.getByRole('link', { name: filter }).click();
  }

  async expectTodoCount(count: number) {
    await expect(this.todoList).toHaveCount(count);
  }

  async expectTodoVisible(text: string) {
    await expect(
      this.page.getByTestId('todo-item').filter({ hasText: new RegExp(`^${text}$`) })
    ).toBeVisible();
  }

  async expectTodoNotVisible(text: string) {
    await expect(
      this.page.getByTestId('todo-item').filter({ hasText: new RegExp(`^${text}$`) })
    ).not.toBeVisible();
  }

  async expectActiveCount(count: number) {
    await expect(this.activeCount).toContainText(`${count}`);
  }
}
