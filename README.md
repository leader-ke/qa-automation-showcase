# QA Automation Showcase

A demonstration of a layered test automation strategy using **Playwright + TypeScript**.

Tests run against public demo targets — no backend setup required, fully runnable by anyone.

---

## Test Strategy

This repo reflects how I approach automation in production: deliberately, not exhaustively.

The goal is not 100% coverage. The goal is **maximum risk reduction per test maintained**.

### Test Pyramid

```
        [ E2E / UI ]         ← critical journeys only, slow, brittle at scale
       [  API layer  ]       ← contract validation, data shape, CRUD flows
      [  Unit / static ]     ← fast, isolated, pure logic
```

Each layer has a different cost/value trade-off:

| Layer | Speed | Stability | What it catches |
|---|---|---|---|
| API | Fast | High | Contract breaks, bad status codes, data shape regressions |
| Web UI | Slower | Medium | Journey-breaking UI regressions, interaction flows |

**Rule of thumb applied here:** if something can be tested at the API layer, it is. UI tests are reserved for flows where the interaction itself (clicks, inputs, navigation) is what's being validated.

---

## Structure

```
api/
  tests/
    users.spec.ts       # User resource: list, get, filter
    posts.spec.ts       # Posts resource: CRUD, filtering

web/
  pages/
    TodoPage.ts         # Page Object Model for the todo UI
  tests/
    todo-core.spec.ts   # Critical user journeys: add, complete, delete, edit
    todo-filters.spec.ts# Filter and bulk action flows

fixtures/
  users.ts              # Shared API test data
  todos.ts              # Shared UI test data

playwright.config.ts    # Projects: api + web, reporters, retry config
```

### Page Object Model

All UI interactions are encapsulated in `web/pages/`. Tests never use selectors directly — they call methods like `todoPage.addTodo()` or `todoPage.filterBy('Active')`. When the UI changes, only the page object needs updating.

### Fixtures

Test data lives in `fixtures/` as typed TypeScript — shared between API and UI tests. This prevents duplication and makes data-driven tests easy to extend.

---

## Running the tests

```bash
npm install
npx playwright install chromium

npm test              # All tests (API + Web)
npm run test:api      # API tests only
npm run test:web      # Web UI tests only
npm run test:report   # Open last HTML report
```

---

## CI

GitHub Actions runs on every push and pull request to `main`:

1. API tests
2. Web UI tests
3. HTML report uploaded as an artifact (retained 14 days)

See `.github/workflows/ci.yml`.

---

## Targets

| Suite | Target |
|---|---|
| API | [JSONPlaceholder](https://jsonplaceholder.typicode.com) — public fake REST API |
| Web UI | [Playwright TodoMVC demo](https://demo.playwright.dev/todomvc) |
