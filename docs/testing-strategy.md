# Testing Strategy

Architecture decisions and engineering rationale behind this test suite.
This document explains _why_ — the README explains _what_.

---

## ADR-1: Test at the lowest sufficient layer

**Decision:** If a behaviour can be validated at the API layer, it is tested there — not at the UI layer.

**Why:** UI tests are 10–50× slower than API tests, more brittle (selectors break, animations flake), and harder to debug. When both a UI test and an API test would catch the same bug, the UI test's only contribution is maintenance cost.

**Consequences:**

- Boolean field validation, filter correctness, and status code checks live in `api/tests/`
- UI tests are reserved for flows where the _interaction_ (focus, click sequence, keyboard nav) is itself the thing being tested
- A bug that appears only in the UI but passes API tests is a rendering/wiring bug — the right place to catch that is a UI test, not a duplicated business logic test

---

## ADR-2: Use Zod for schema validation, not manual `typeof` assertions

**Decision:** API response shapes are validated with Zod schemas in `api/schemas/index.ts`.

**Why:** `expect(typeof x.completed).toBe('boolean')` has five failure modes it doesn't catch:

- `null` (typeof null === 'object')
- `undefined` (typeof undefined === 'undefined', but the field being absent is also a violation)
- Empty string for a required string field
- An integer field that accepted a float
- Nested object fields that changed shape

Zod's `safeParse` returns a structured error report that names the exact field and constraint that failed. It also infers TypeScript types — the schema is the single source of truth for both runtime validation and compile-time types.

**Trade-off:** Zod is an additional dependency. The alternative is a JSON Schema validator (Ajv) or hand-rolled assertions. Zod was chosen because it integrates directly with TypeScript and produces idiomatic type definitions.

---

## ADR-3: Both Playwright and Cypress are present — intentionally

**Decision:** Core UI journeys are tested in both Playwright (`web/playwright/`) and Cypress (`web/cypress/`).

**Why this is intentional:** In a production codebase, this would be waste. In a showcase:

1. Both tools have legitimate use cases. Cypress's developer experience for interactive debugging is genuinely better; Playwright's multi-browser parallelism scales better for large suites.
2. The same abstractions apply: Playwright uses Page Objects, Cypress uses custom commands. Showing the pattern holds across tools demonstrates the _pattern_, not just tool knowledge.
3. Cross-tool validation: if a test passes in one framework and fails in another, that's a signal worth investigating.

**In production, I would pick one.** The decision criterion: if the team needs component-level tests with hot reload, Cypress. If the team needs multi-browser parallel execution at scale, Playwright.

---

## ADR-4: Mutation testing on the unit layer

**Decision:** Stryker runs against `unit/utils/testResultsParser.ts` and generates a mutation score.

**Why:** Pass rate is a vanity metric. A test suite with a 100% pass rate but 40% mutation score means 60% of bugs introduced to that code would go undetected. Mutation testing introduces deliberate code changes (swap `>` for `>=`, remove a condition, flip a boolean) and verifies the test suite catches them.

**Threshold:** Stryker is configured with `break: 50` — if the mutation score drops below 50%, the CI job fails. This is intentionally conservative for a first pass; a mature suite would target 75%+.

**Scope:** Mutation testing runs only on `unit/` — it's too slow to run on integration tests, and the value is highest on pure logic functions where mutations are meaningful.

---

## ADR-5: Visual regression tests require committed baselines

**Decision:** Visual snapshots are committed to git in `web/playwright/visual-baselines/`.

**Why:** Visual tests that compare against a dynamically generated baseline on every run provide no regression detection — they always pass. The baseline must represent a _known good state_, committed at a specific point in time.

**Workflow:**

1. Generate baselines: `npm run test:visual:update`
2. Review the generated images in `web/playwright/visual-baselines/`
3. Commit them: `git add web/playwright/visual-baselines/ && git commit`
4. CI compares subsequent runs against the committed baseline

**Updating baselines:** When intentional UI changes land, run `npm run test:visual:update`, review the diffs, and commit the new baselines. This makes intentional visual changes explicit in the PR.

---

## ADR-6: k6 over JMeter or Gatling

**Decision:** Performance tests use k6.

**Why:**

- k6 scripts are JavaScript — reviewable in PRs, no XML or Scala
- k6 runs in CI as a single binary with no GUI dependency
- Load profiles and thresholds live next to the tests they protect
- The `grafana/setup-k6-action` GitHub Action installs k6 with one line

**Thresholds as gates:** k6 thresholds are not metrics to observe — they are assertions that fail CI. A performance test that doesn't fail CI when performance degrades is documentation, not protection.

---

## Test execution tiers

Tests are tagged to support selective execution in CI and locally.

| Tag           | Purpose                                 | When it runs | Target duration |
| ------------- | --------------------------------------- | ------------ | --------------- |
| `@smoke`      | Is the system alive? Critical path only | Every push   | < 30s           |
| `@regression` | Full behavioural coverage               | PRs to main  | 3–5 min         |
| `@a11y`       | Accessibility audit (axe + keyboard)    | PRs to main  | 1–2 min         |
| `@visual`     | CSS/layout regression detection         | PRs to main  | 2–3 min         |

**Smoke gate:** The `smoke` CI job runs first and blocks the full regression suite if it fails. A broken smoke means something fundamental is wrong — there's no value running 200 more tests to confirm it.

---

## Flakiness policy

Flaky tests erode trust faster than no tests. A suite that fails randomly on 1 in 10 runs trains engineers to re-run rather than investigate — and re-running disguises real failures.

**Policy applied in this repo:**

- `retries: 2` in CI (playwright.config.ts) — a test that passes on retry is marked `flaky`, not `passed`
- Flaky tests are treated as bugs: investigate root cause, don't just retry-suppress
- `trace: 'on-first-retry'` captures a full trace on the first failure for diagnosis

**On retries:** Retries are not a fix for flaky tests — they are a diagnostic tool. A test that needs retries to pass in CI is telling you something about timing, isolation, or dependency on external state.

---

## Coverage philosophy

No coverage percentage target is set. Here's why:

Coverage measures which lines were _executed_, not which behaviours were _tested_. A `for` loop that iterates over an empty array can achieve 100% line coverage while testing nothing meaningful. Coverage is useful for finding untested code paths, not for proving quality.

**What this suite targets instead:**

- All documented API contracts validated (schema + status codes)
- All critical user journeys covered at the UI layer
- All pure logic functions covered with mutation testing
- Performance thresholds enforced as CI gates
- Accessibility compliance at WCAG 2.1 AA

---

## What is intentionally absent

| Missing                                          | Why                                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Full coverage of all 6 JSONPlaceholder resources | 3 resources tested in depth > 6 resources tested shallowly                               |
| E2E test for every user story                    | If the API test passes, a UI test for the same logic adds cost without signal            |
| Contract testing between consumers (Pact)        | Warranted when multiple services consume this API; overkill for a single-consumer demo   |
| Device farm mobile testing                       | Kaspresso sample is illustrative; real mobile CI requires BrowserStack/Firebase Test Lab |
| Full visual baseline set                         | Depends on rendering environment; see ADR-5                                              |
