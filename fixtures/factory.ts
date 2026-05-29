/**
 * Test data factories
 *
 * Static fixtures break at scale: tests share state, change one and break
 * ten others, and you can't generate parameterized data without copypasting.
 *
 * The factory/builder pattern solves this:
 * - Each `build()` call returns an independent object — no shared references
 * - Overrides let tests express only what matters: `TodoFactory.build({ completed: true })`
 * - Traits are named presets for common test scenarios
 * - `buildList` generates realistic datasets without repetition
 *
 * The sequence counter ensures unique titles/IDs across a test run,
 * preventing subtle failures when assertions depend on uniqueness.
 */
import type { ApiTodo } from './todos-api';
import type { NewPost } from './users';

// ---------------------------------------------------------------------------
// Sequence — unique identifier per factory call within a test run
// ---------------------------------------------------------------------------

const makeCounter = () => {
  let n = 0;
  return () => ++n;
};

const seq = makeCounter();

// ---------------------------------------------------------------------------
// TodoFactory
// ---------------------------------------------------------------------------

export const TodoFactory = {
  /**
   * Build a single todo with sensible defaults.
   * Pass `overrides` to express only what the test cares about.
   */
  build(overrides: Partial<ApiTodo> = {}): ApiTodo {
    const n = seq();
    return {
      userId: 1,
      title: `Test todo item ${n}`,
      completed: false,
      ...overrides,
    };
  },

  /** Build N independent todo objects. */
  buildList(count: number, overrides: Partial<ApiTodo> = {}): ApiTodo[] {
    return Array.from({ length: count }, () => TodoFactory.build(overrides));
  },

  // Traits — named configurations for common test scenarios

  /** A todo that has already been completed. */
  completed(overrides: Partial<ApiTodo> = {}): ApiTodo {
    return TodoFactory.build({ completed: true, ...overrides });
  },

  /** A todo belonging to a specific user. */
  forUser(userId: number, overrides: Partial<ApiTodo> = {}): ApiTodo {
    return TodoFactory.build({ userId, ...overrides });
  },

  /** A mix of completed and incomplete todos — useful for filter tests. */
  mixed(count: number): ApiTodo[] {
    return Array.from({ length: count }, (_, i) => TodoFactory.build({ completed: i % 2 === 0 }));
  },
};

// ---------------------------------------------------------------------------
// PostFactory
// ---------------------------------------------------------------------------

export const PostFactory = {
  build(overrides: Partial<NewPost> = {}): NewPost {
    const n = seq();
    return {
      title: `Post title ${n}`,
      body: `Body of post ${n}. This is placeholder content for testing.`,
      userId: 1,
      ...overrides,
    };
  },

  buildList(count: number, overrides: Partial<NewPost> = {}): NewPost[] {
    return Array.from({ length: count }, () => PostFactory.build(overrides));
  },

  // Traits

  /** A post with an intentionally long body — for truncation/rendering tests. */
  longBody(overrides: Partial<NewPost> = {}): NewPost {
    return PostFactory.build({
      body: 'Lorem ipsum dolor sit amet. '.repeat(20).trim(),
      ...overrides,
    });
  },

  /** A post with minimal content — useful for boundary tests. */
  minimal(overrides: Partial<NewPost> = {}): NewPost {
    return PostFactory.build({ title: 'x', body: 'x', ...overrides });
  },
};

// ---------------------------------------------------------------------------
// TodoItemFactory  (UI fixture format used by Playwright tests)
// ---------------------------------------------------------------------------

export interface TodoItem {
  text: string;
  completed?: boolean;
}

export const TodoItemFactory = {
  build(overrides: Partial<TodoItem> = {}): TodoItem {
    const n = seq();
    return {
      text: `Todo item ${n}`,
      completed: false,
      ...overrides,
    };
  },

  buildList(count: number, overrides: Partial<TodoItem> = {}): TodoItem[] {
    return Array.from({ length: count }, () => TodoItemFactory.build(overrides));
  },

  /** Returns a realistic QA-themed set of todo items. */
  realistic(): TodoItem[] {
    return [
      { text: 'Write acceptance criteria for login flow' },
      { text: 'Automate regression suite for checkout' },
      { text: 'Review PR for null safety issues' },
      { text: 'Update test plan for release', completed: true },
      { text: 'Run exploratory session on new onboarding' },
    ];
  },
};
