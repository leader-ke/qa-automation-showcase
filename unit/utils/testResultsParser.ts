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
  const passRate = actionable.length > 0
    ? Math.round(((passed + flaky) / actionable.length) * 100)
    : 0;

  return { total: results.length, passed, failed, skipped, flaky, passRate, totalDuration, slowestTest };
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
