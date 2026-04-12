# QA Automation Showcase

A demonstration of a layered test automation strategy across multiple frameworks and testing levels.

Tests run against public demo targets — no backend setup required, fully runnable by anyone.

---

## Test Strategy

This repo reflects how I approach automation in production: deliberately, not exhaustively.

The goal is not 100% coverage. The goal is **maximum risk reduction per test maintained**.

### Test Pyramid

```
        [ E2E / UI ]         <- critical journeys only, slow, brittle at scale
       [  API layer  ]       <- contract validation, data shape, CRUD flows
      [  Unit / static ]     <- fast, isolated, pure logic
     [ Performance ]         <- load characteristics, response time thresholds
```

Each layer has a different cost/value trade-off:

| Layer | Tool | Speed | Stability | What it catches |
|---|---|---|---|---|
| API | Playwright | Fast | High | Contract breaks, bad status codes, data shape regressions |
| Web UI | Playwright | Slower | Medium | Journey-breaking UI regressions, interaction flows |
| Web UI | Cypress | Slower | Medium | Cross-tool validation, component interactions |
| Unit | Jest | Very fast | Very high | Pure logic correctness, edge cases |
| Performance | k6 | Variable | High | Latency thresholds, failure rates under load |
| Mobile | Kaspresso | Slower | Medium | Android UI journeys (sample) |

**Rule of thumb applied here:** if something can be tested at the API layer, it is. UI tests are reserved for flows where the interaction itself (clicks, inputs, navigation) is what's being validated.

---

## Structure

```
api/
  tests/
    users.spec.ts            # User resource: list, get, filter
    posts.spec.ts            # Posts resource: CRUD, filtering
    todos.spec.ts            # Todos resource: list, create, patch

web/
  playwright/
    pages/
      TodoPage.ts            # Page Object Model (Playwright)
    tests/
      todo-core.spec.ts      # Critical user journeys: add, complete, delete, edit
      todo-filters.spec.ts   # Filter and bulk action flows
      todo-keyboard.spec.ts  # Keyboard-only navigation
      todo-edge-cases.spec.ts# Empty state, input validation, bulk toggle
      todo-persistence.spec.ts# State survives page reload
  cypress/
    support/
      commands.ts            # Custom commands: addTodo, completeTodo, deleteTodo
      e2e.ts                 # Support file
    e2e/
      todo-core.cy.ts        # Core journeys
      todo-filters.cy.ts     # Filter flows

unit/
  utils/
    testResultsParser.ts     # Pure utility functions for parsing test results
    testResultsParser.test.ts# Jest tests: summarise, filter, health check, categorise

performance/
  tests/
    smoke-test.js            # k6: 1 VU, sanity check before load
    load-test.js             # k6: ramp to 10 VUs, sustained load, thresholds

mobile/
  src/test/kotlin/com/example/
    TodoListTest.kt          # Kaspresso sample: Android todo UI tests

fixtures/
  users.ts                   # Shared API test data
  todos.ts                   # Shared UI test data

playwright.config.ts         # Projects: api + web-playwright, reporters, retry config
cypress.config.ts            # Cypress: baseUrl, specPattern, supportFile
jest.config.ts               # Jest: ts-jest, unit test match pattern
```

### Page Object Model

All Playwright UI interactions are encapsulated in `web/playwright/pages/`. Tests never use selectors directly — they call methods like `todoPage.addTodo()` or `todoPage.filterBy('Active')`. When the UI changes, only the page object needs updating.

Cypress achieves the same separation through custom commands in `web/cypress/support/commands.ts`.

### Fixtures

Test data lives in `fixtures/` as typed TypeScript, shared between API and UI tests. This prevents duplication and makes data-driven tests easy to extend.

---

## Running the tests

```bash
npm install
npx playwright install chromium

# Playwright: API + Web UI
npm test
npm run test:api
npm run test:web:playwright
npm run test:report           # Open last HTML report

# Cypress: Web UI
npm run test:web:cypress

# Jest: Unit tests
npm run test:unit

# k6: Performance (requires k6 installed — https://k6.io/docs/get-started/installation/)
k6 run performance/tests/smoke-test.js
k6 run performance/tests/load-test.js

# Kaspresso: Android mobile (requires Android emulator or device)
# See mobile/src/test/kotlin/com/example/TodoListTest.kt
# Run with: ./gradlew connectedAndroidTest
```

---

## CI

GitHub Actions runs on every push and pull request to `main`:

| Job | What runs |
|---|---|
| `playwright` | API tests + Playwright Web UI tests |
| `cypress` | Cypress Web UI tests |
| `unit` | Jest unit tests |

HTML reports and failure screenshots are uploaded as artifacts.

See `.github/workflows/ci.yml`.

---

## Targets

| Suite | Target |
|---|---|
| API | [JSONPlaceholder](https://jsonplaceholder.typicode.com) — public fake REST API |
| Web UI (Playwright + Cypress) | [Playwright TodoMVC demo](https://demo.playwright.dev/todomvc) |
| Performance (k6) | [JSONPlaceholder](https://jsonplaceholder.typicode.com) |
| Mobile (Kaspresso) | Sample Android app (illustrative — not runnable without the app) |
