/**
 * Test results parser utilities
 *
 * Real-world QA tooling often needs to parse, summarise, and categorise
 * test results from CI runs. These utilities are unit-testable pure functions.
 */

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'flaky';

export interface TestResult {
  name: string;
  status: TestStatus;
  duration: number;
  retries?: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  passRate: number;
  totalDuration: number;
  slowestTest: TestResult | null;
}

export function summariseResults(results: TestResult[]): TestSummary {
  if (results.length === 0) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      flaky: 0,
      passRate: 0,
      totalDuration: 0,
      slowestTest: null,
    };
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const flaky = results.filter((r) => r.status === 'flaky').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const slowestTest = results.reduce((slowest, r) =>
    r.duration > (slowest?.duration ?? 0) ? r : slowest
  );

  const actionable = results.filter((r) => r.status !== 'skipped');
  const passRate =
    actionable.length > 0 ? Math.round(((passed + flaky) / actionable.length) * 100) : 0;

  return {
    total: results.length,
    passed,
    failed,
    skipped,
    flaky,
    passRate,
    totalDuration,
    slowestTest,
  };
}

export function filterByStatus(results: TestResult[], status: TestStatus): TestResult[] {
  return results.filter((r) => r.status === status);
}

export function isHealthy(summary: TestSummary, threshold = 95): boolean {
  return summary.failed === 0 && summary.passRate >= threshold;
}

export function categoriseByDuration(
  results: TestResult[],
  slowThresholdMs = 3000
): { fast: TestResult[]; slow: TestResult[] } {
  return {
    fast: results.filter((r) => r.duration < slowThresholdMs),
    slow: results.filter((r) => r.duration >= slowThresholdMs),
  };
}

/**
 * Identifies tests that passed only after retrying — these are flaky
 * candidates that warrant investigation. A test with retries > 0 that
 * ultimately passed is masking an intermittent problem.
 */
export function detectFlakyTests(results: TestResult[]): TestResult[] {
  return results.filter((r) => r.status === 'flaky' || (r.retries !== undefined && r.retries > 0));
}

export interface RegressionReport {
  newFailures: number;
  resolvedFailures: number;
  passRateDelta: number;
  isRegression: boolean;
}

/**
 * Compares two test summaries — useful for tracking trends across CI runs.
 * A CI pipeline can emit a regression report to flag when a PR degrades
 * the test suite even if it doesn't go red.
 *
 * `isRegression` is true when:
 * - The number of failures increased, OR
 * - The pass rate dropped by more than `passRateTolerancePct`
 */
export function computeRegressionReport(
  previous: TestSummary,
  current: TestSummary,
  passRateTolerancePct = 2
): RegressionReport {
  const newFailures = Math.max(0, current.failed - previous.failed);
  const resolvedFailures = Math.max(0, previous.failed - current.failed);
  const passRateDelta = current.passRate - previous.passRate;
  const isRegression = newFailures > 0 || passRateDelta < -passRateTolerancePct;

  return { newFailures, resolvedFailures, passRateDelta, isRegression };
}
