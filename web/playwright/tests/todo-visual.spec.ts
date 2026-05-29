/**
 * Web UI layer: Visual regression
 *
 * Visual tests catch a category of bugs that logic tests miss entirely:
 * CSS regressions, layout shifts, z-index issues, unintended style overrides.
 * A button that still functions but is invisible is a bug — and functional
 * tests won't find it.
 *
 * How it works:
 * Playwright captures a screenshot and compares it pixel-by-pixel against
 * a committed baseline. If the diff exceeds the configured threshold, the
 * test fails and produces a diff image showing exactly what changed.
 *
 * Baseline management:
 * Baselines live in `web/playwright/visual-baselines/` and are committed
 * to git. To generate or update baselines:
 *
 *   npm run test:visual:update
 *
 * Review the generated images before committing — they represent the
 * approved visual state. Updating baselines on a PR makes visual changes
 * explicit and reviewable.
 *
 * Note: Visual tests use a locked 1280×720 viewport (configured in the
 * `visual` playwright project) for cross-environment consistency.
 */
import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';
import { todoItems } from '../../../fixtures/todos';

test.describe('Todo — visual regression', { tag: ['@visual'] }, () => {
  test('empty state', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');

    // Wait for fonts and any async rendering to settle
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('empty-state.png', {
      // Allow 2% pixel difference for sub-pixel rendering and font hinting
      // variation across environments
      maxDiffPixelRatio: 0.02,
    });
  });

  test('populated list', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.addTodos(todoItems.slice(0, 3).map((t) => t.text));

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('populated-list.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('mixed completed and active items', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.addTodos(todoItems.slice(0, 3).map((t) => t.text));
    await todoPage.completeTodo(todoItems[0].text);

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('mixed-state.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('active filter view', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.addTodos(todoItems.slice(0, 3).map((t) => t.text));
    await todoPage.completeTodo(todoItems[0].text);
    await todoPage.filterBy('Active');

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('active-filter.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('completed filter view', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.addTodos(todoItems.slice(0, 3).map((t) => t.text));
    await todoPage.completeTodo(todoItems[0].text);
    await todoPage.filterBy('Completed');

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('completed-filter.png', {
      maxDiffPixelRatio: 0.02,
    });
  });

  test('item in edit mode', async ({ page }) => {
    const todoPage = new TodoPage(page);
    await todoPage.goto();
    await todoPage.addTodo(todoItems[0].text);

    // Double-click to enter edit mode
    const item = page.getByTestId('todo-item').filter({ hasText: todoItems[0].text });
    await item.dblclick();

    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('edit-mode.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
