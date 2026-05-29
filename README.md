# QA Automation Showcase

Engineering-grade test automation across API, Web UI, accessibility, visual regression, performance, and mutation testing layers.

Tests run against public demo targets — no backend setup required.

---

## Philosophy

Three things kill test suites:

1. **Testing at the wrong layer** — validating business logic through a browser when an API call is faster, more reliable, and gives a clearer failure message
2. **Confusing coverage with confidence** — a line executed is not a behaviour tested; a test that never fails is worthless
3. **No exit criteria** — tests without thresholds or CI gates are documentation, not protection

The goal here is not 100% coverage. It is **maximum risk reduction per test maintained**.

### The pyramid

```
             [ Visual ]           ← CSS/layout regressions logic tests miss
           [ A11y / E2E ]         ← axe scans, keyboard flows, critical journeys
         [   API layer   ]        ← contracts, data shapes, CRUD, status codes
       [   Unit / static  ]       ← pure logic, mutation-tested for quality
     [     Performance     ]      ← latency thresholds enforced as CI gates
```

Each layer has a different cost/signal ratio:

| Layer         | Tools                   | Speed     | What it catches                                                          |
| ------------- | ----------------------- | --------- | ------------------------------------------------------------------------ |
| Visual        | Playwright snapshots    | Slow      | CSS regressions, layout shifts, invisible elements                       |
| Web UI        | Playwright, Cypress     | Slower    | Journey-breaking regressions, interaction flows, focus management        |
| Accessibility | axe-core/playwright     | Slower    | WCAG violations, missing labels, keyboard operability                    |
| API           | Playwright request, Zod | Fast      | Schema contracts, status codes, filter correctness, mutation correctness |
| Unit          | Jest + Stryker          | Very fast | Pure logic correctness, verified by mutation testing                     |
| Performance   | k6                      | Variable  | Latency thresholds, failure rates, behaviour under load                  |

**Rule applied throughout:** if something can be tested at a lower layer, it is. UI tests are reserved for flows where the _interaction itself_ — clicks, focus, keyboard sequences — is what's under test.

---

## Architecture decisions

The full reasoning is in [`docs/testing-strategy.md`](docs/testing-strategy.md). Short version:

**Why Playwright for API tests?**
Playwright's `request` fixture is a full HTTP client with built-in context sharing and TypeScript types. One tool for API and UI tests reduces CI dependencies and cognitive overhead. The alternative (separate axios/supertest setup) adds packages without adding capability.

**Why Zod for schema validation?**
`typeof field === 'string'` doesn't catch `null`, `undefined`, empty strings, or type coercion bugs. Zod schemas define the _contract_ — structural invariants the consumer depends on — and produce field-level error messages when violated. Types are inferred from schemas, so there's one source of truth.

**Why both Playwright and Cypress?**
Honest answer: this is a showcase. In a production codebase, pick one. Cypress has better DX for interactive debugging; Playwright has better multi-browser parallelism at scale. The same abstraction works in both: Page Objects in Playwright, custom commands in Cypress.

**Why mutation testing?**
Pass rate is a vanity metric. Stryker introduces deliberate code mutations (flipping booleans, swapping operators, removing conditions) and verifies the test suite catches them. A mutation score below 50% fails CI — it means the tests wouldn't catch more than half the realistic bugs that could be introduced.

**Why k6 over JMeter/Gatling?**
k6 scripts are JavaScript, version-controlled, and run in CI as a single binary. Load profiles and thresholds live next to the tests they protect. Thresholds aren't metrics to observe — they're assertions that fail CI when performance degrades.

---

## Test execution tiers

Tests are tagged for selective execution. CI uses this to run fast gates on every push and the full suite only on PRs.

| Tag           | Purpose                                 | When it runs | Target  |
| ------------- | --------------------------------------- | ------------ | ------- |
| `@smoke`      | Is the system alive? 3–5 critical tests | Every push   | < 30s   |
| `@regression` | Full behavioural coverage               | PRs to main  | 3–5 min |
| `@a11y`       | Accessibility audit                     | PRs to main  | 1–2 min |
| `@visual`     | CSS/layout regression                   | PRs to main  | 2–3 min |

```bash
npm run test:smoke        # @smoke only — fast gate
npm run test:regression   # @regression — full suite
npm run test:a11y         # @a11y — accessibility
npm run test:visual       # @visual — visual regression
```

---

## Structure

```
api/
  schemas/
    index.ts              # Zod schemas: Todo, Post, User (infers TypeScript types)
  tests/
    todos.spec.ts         # Todos: list, filter, create, patch  [@smoke @regression]
    posts.spec.ts         # Posts: CRUD, filter                 [@smoke @regression]
    posts-mutations.spec.ts # Posts: PUT, PATCH, DELETE         [@regression]
    users.spec.ts         # Users: list, get, sub-resources     [@smoke @regression]
    schema-contracts.spec.ts # Zod contract validation         [@regression]

web/
  playwright/
    pages/
      TodoPage.ts         # Page Object Model — all selectors in one place
    tests/
      todo-core.spec.ts         # Critical journeys: add, complete, delete, edit  [@smoke @regression]
      todo-filters.spec.ts      # Filter and bulk action flows                    [@regression]
      todo-keyboard.spec.ts     # Keyboard-only navigation                        [@regression @a11y]
      todo-edge-cases.spec.ts   # Empty state, input validation, bulk toggle      [@regression]
      todo-persistence.spec.ts  # State survives reload                           [@regression]
      todo-a11y.spec.ts         # axe scans, focus management, ARIA semantics     [@a11y @regression]
      todo-visual.spec.ts       # Pixel-level snapshot comparison                 [@visual]
    visual-baselines/     # Committed screenshot baselines (see below)
  cypress/
    support/
      commands.ts         # Custom commands: addTodo, completeTodo, deleteTodo
    e2e/
      todo-core.cy.ts     # Core journeys
      todo-filters.cy.ts  # Filter flows

unit/
  utils/
    testResultsParser.ts  # Pure utilities: summarise, filter, detect flaky, regression diff
    testResultsParser.test.ts  # Jest tests — mutation-tested by Stryker

performance/
  tests/
    smoke-test.js         # k6: 1 VU, 1 iteration — is the system responding?
    load-test.js          # k6: ramp to 10 VUs, thresholds enforced

fixtures/
  todos.ts                # Static UI test data
  todos-api.ts            # Static API test data
  factory.ts              # TodoFactory, PostFactory, TodoItemFactory (builder pattern)

mobile/
  src/test/kotlin/com/example/
    TodoListTest.kt       # Kaspresso sample: Android UI journeys (illustrative)

docs/
  testing-strategy.md     # ADRs: why each decision was made, trade-offs, what's absent
```

### Page Object Model

All Playwright UI interactions are encapsulated in `web/playwright/pages/`. Tests call `todoPage.addTodo()`, not `page.getByPlaceholder(...).fill(...)`. When the UI changes, only the page object needs updating.

Cypress achieves the same separation via custom commands in `web/cypress/support/commands.ts`.

### Test data factories

`fixtures/factory.ts` provides builder-pattern factories for creating test data. This prevents tests from sharing state through fixtures and makes data-driven tests easy to extend:

```typescript
// Static fixtures — fine for simple cases
import { singleTodo } from '../fixtures/todos';

// Factory — for parameterised or isolated data
import { TodoFactory, TodoItemFactory } from '../fixtures/factory';

const todo = TodoFactory.build({ completed: true });
const items = TodoItemFactory.buildList(5);
const mixed = TodoItemFactory.realistic(); // QA-domain test data
```

### Visual baseline management

Visual baselines are committed to `web/playwright/visual-baselines/`. On first setup:

```bash
npm run test:visual:update   # generate baselines
git add web/playwright/visual-baselines/
git commit -m "chore: add visual test baselines"
```

When intentional UI changes land, update baselines explicitly — this makes visual changes reviewable in PRs.

---

## Code quality tooling

**ESLint** (`eslint.config.js`) — TypeScript-aware linting with `typescript-eslint`. Catches floating promises (a common async test bug), unused variables, and type-unsafe patterns. Runs in CI on every push.

**Prettier** (`.prettierrc.json`) — consistent formatting, enforced in CI with `--check`. Avoids formatting debates in PRs.

**Husky + lint-staged** — git hooks that run quality gates locally, before code reaches CI:

| Hook         | Runs              | What                                                   |
| ------------ | ----------------- | ------------------------------------------------------ |
| `pre-commit` | On every commit   | `lint-staged` — ESLint + Prettier on staged files only |
| `pre-push`   | Before `git push` | `tsc --noEmit` + smoke tests                           |

The pre-push hook mirrors the first tier of CI — catching type errors and critical path failures locally before waiting for CI to report them.

```bash
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier write
npm run format:check   # Prettier check (used in CI)
```

---

## Running the tests

```bash
npm install
npx playwright install chromium

# By tier
npm run test:smoke          # Fast gate: @smoke tests only
npm run test:regression     # Full regression suite
npm run test:a11y           # Accessibility suite
npm run test:visual         # Visual regression (requires committed baselines)

# By tool
npm run test:api            # Playwright API tests
npm run test:web:playwright # Playwright UI tests
npm run test:web:cypress    # Cypress UI tests
npm run test:unit           # Jest unit tests
npm run test:mutation       # Stryker mutation testing

# Reports
npm run test:report         # Open last Playwright HTML report

# k6 (requires k6 — https://k6.io/docs/get-started/installation/)
k6 run performance/tests/smoke-test.js
k6 run performance/tests/load-test.js
```

---

## CI

GitHub Actions runs on every push and PR to `main`, structured in dependency tiers:

```
push/PR
  ├── lint         (TypeScript type check)
  ├── unit         (Jest — fast)
  └── smoke        (critical path — blocks everything below)
       ├── playwright    (API + full Web UI regression)
       ├── cypress       (Web UI cross-tool)
       ├── accessibility (axe + keyboard)
       ├── visual        (screenshot comparison)
       └── performance   (k6 with thresholds)

unit ──► mutation       (Stryker — independent of smoke gate)
```

**Why the smoke gate?** If the critical path is broken, there's no value running 200 more tests. The smoke job runs in ~30 seconds and unblocks (or saves) the rest.

Artifacts uploaded on every run:

- `playwright-report` — full HTML report with traces and screenshots
- `accessibility-report` — axe violation details
- `mutation-report` — Stryker HTML report with mutation score per function
- `visual-diffs` — pixel diff images on visual test failures

---

## Targets

| Suite                                         | Target                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| API + Performance                             | [JSONPlaceholder](https://jsonplaceholder.typicode.com) — public fake REST API |
| Web UI (Playwright + Cypress) + Visual + A11y | [Playwright TodoMVC demo](https://demo.playwright.dev/todomvc)                 |
| Mobile                                        | Sample Android app (illustrative — see `mobile/`)                              |

---

## What's intentionally not here

| Absent                                         | Why                                                                       |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| Full coverage of all JSONPlaceholder resources | 3 resources tested in depth > 6 tested shallowly                          |
| E2E tests for every user story                 | API-tested logic doesn't need a UI test to prove it works                 |
| Consumer-driven contract testing (Pact)        | Warranted for multi-service systems; overkill for a single-consumer demo  |
| Real device mobile CI                          | Requires BrowserStack/Firebase Test Lab; Kaspresso sample is illustrative |
| Full visual baseline set                       | Environment-dependent; generate locally with `npm run test:visual:update` |

See [`docs/testing-strategy.md`](docs/testing-strategy.md) for the full rationale.
