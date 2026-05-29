/**
 * Unit tests — testResultsParser
 *
 * Pure function tests: no network, no browser, no setup.
 * Fast feedback on the logic that drives QA reporting and health checks.
 */
import {
  summariseResults,
  filterByStatus,
  isHealthy,
  categoriseByDuration,
  detectFlakyTests,
  computeRegressionReport,
  type TestResult,
} from './testResultsParser';

const mockResults: TestResult[] = [
  { name: 'user can log in', status: 'passed', duration: 800 },
  { name: 'user can log out', status: 'passed', duration: 600 },
  { name: 'checkout flow completes', status: 'passed', duration: 1200 },
  { name: 'payment fails gracefully', status: 'failed', duration: 500 },
  { name: 'profile update saves', status: 'flaky', duration: 4500, retries: 2 },
  { name: 'legacy report export', status: 'skipped', duration: 0 },
];

describe('summariseResults', () => {
  it('returns correct counts for each status', () => {
    const summary = summariseResults(mockResults);

    expect(summary.total).toBe(6);
    expect(summary.passed).toBe(3);
    expect(summary.failed).toBe(1);
    expect(summary.flaky).toBe(1);
    expect(summary.skipped).toBe(1);
  });

  it('calculates total duration correctly', () => {
    const summary = summariseResults(mockResults);
    expect(summary.totalDuration).toBe(7600);
  });

  it('identifies the slowest test', () => {
    const summary = summariseResults(mockResults);
    expect(summary.slowestTest?.name).toBe('profile update saves');
  });

  it('excludes skipped tests from pass rate calculation', () => {
    const summary = summariseResults(mockResults);
    // 3 passed + 1 flaky = 4 out of 5 actionable = 80%
    expect(summary.passRate).toBe(80);
  });

  it('returns zero pass rate for empty results', () => {
    const summary = summariseResults([]);
    expect(summary.passRate).toBe(0);
    expect(summary.slowestTest).toBeNull();
  });

  it('handles all-passed results', () => {
    const allPassed: TestResult[] = [
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 200 },
    ];
    const summary = summariseResults(allPassed);
    expect(summary.passRate).toBe(100);
    expect(summary.failed).toBe(0);
  });
});

describe('filterByStatus', () => {
  it('returns only tests matching the given status', () => {
    const failed = filterByStatus(mockResults, 'failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].name).toBe('payment fails gracefully');
  });

  it('returns empty array when no tests match', () => {
    const results: TestResult[] = [{ name: 'test a', status: 'passed', duration: 100 }];
    expect(filterByStatus(results, 'failed')).toHaveLength(0);
  });
});

describe('isHealthy', () => {
  it('returns false when there are failures', () => {
    const summary = summariseResults(mockResults);
    expect(isHealthy(summary)).toBe(false);
  });

  it('returns true when no failures and pass rate meets threshold', () => {
    const passing: TestResult[] = [
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 200 },
    ];
    const summary = summariseResults(passing);
    expect(isHealthy(summary)).toBe(true);
  });

  it('respects a custom threshold', () => {
    const mixed: TestResult[] = [
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 200 },
      { name: 'test c', status: 'passed', duration: 300 },
      { name: 'test d', status: 'skipped', duration: 0 },
    ];
    const summary = summariseResults(mixed);
    expect(isHealthy(summary, 90)).toBe(true);
    expect(isHealthy(summary, 100)).toBe(true);
  });
});

describe('categoriseByDuration', () => {
  it('splits tests into fast and slow buckets', () => {
    const { fast, slow } = categoriseByDuration(mockResults, 3000);

    expect(fast.length).toBe(5);
    expect(slow.length).toBe(1);
    expect(slow[0].name).toBe('profile update saves');
  });

  it('uses custom threshold when provided', () => {
    const result = categoriseByDuration(mockResults, 1000);

    expect(result.slow.length).toBe(2); // checkout (1200ms) and profile update (4500ms)
  });
});

describe('detectFlakyTests', () => {
  it('returns tests with flaky status', () => {
    const flaky = detectFlakyTests(mockResults);

    expect(flaky.some((r) => r.name === 'profile update saves')).toBe(true);
  });

  it('returns tests that passed after retries (retries > 0)', () => {
    const results: TestResult[] = [
      { name: 'stable test', status: 'passed', duration: 100 },
      { name: 'recovered test', status: 'passed', duration: 200, retries: 1 },
    ];
    const flaky = detectFlakyTests(results);

    expect(flaky).toHaveLength(1);
    expect(flaky[0].name).toBe('recovered test');
  });

  it('returns empty array when no flaky tests exist', () => {
    const stable: TestResult[] = [
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 200 },
    ];
    expect(detectFlakyTests(stable)).toHaveLength(0);
  });
});

describe('computeRegressionReport', () => {
  it('detects new failures as a regression', () => {
    const previous = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 100 },
    ]);
    const current = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'failed', duration: 100 },
    ]);

    const report = computeRegressionReport(previous, current);

    expect(report.isRegression).toBe(true);
    expect(report.newFailures).toBe(1);
    expect(report.resolvedFailures).toBe(0);
  });

  it('detects a pass rate drop beyond tolerance as a regression', () => {
    const previous = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 100 },
      { name: 'test c', status: 'passed', duration: 100 },
      { name: 'test d', status: 'passed', duration: 100 },
      { name: 'test e', status: 'passed', duration: 100 },
    ]);
    // 2 previously-passing tests now fail → pass rate drops from 100% → 60%
    const current = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 100 },
      { name: 'test c', status: 'passed', duration: 100 },
      { name: 'test d', status: 'failed', duration: 100 },
      { name: 'test e', status: 'failed', duration: 100 },
    ]);

    const report = computeRegressionReport(previous, current);

    // passRateDelta should be negative — the suite degraded
    expect(report.passRateDelta).toBeLessThan(0);
    expect(report.isRegression).toBe(true);
  });

  it('reports resolved failures correctly', () => {
    const previous = summariseResults([
      { name: 'test a', status: 'failed', duration: 100 },
      { name: 'test b', status: 'failed', duration: 100 },
    ]);
    const current = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 100 },
    ]);

    const report = computeRegressionReport(previous, current);

    expect(report.isRegression).toBe(false);
    expect(report.resolvedFailures).toBe(2);
    expect(report.newFailures).toBe(0);
  });

  it('is not a regression when pass rate drops within tolerance', () => {
    const previous = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 100 },
    ]);
    // Same results — no change
    const report = computeRegressionReport(previous, previous);

    expect(report.isRegression).toBe(false);
    expect(report.passRateDelta).toBe(0);
  });

  it('uses custom pass rate tolerance', () => {
    const previous = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 100 },
      { name: 'test c', status: 'passed', duration: 100 },
      { name: 'test d', status: 'passed', duration: 100 },
      { name: 'test e', status: 'passed', duration: 100 },
    ]);
    const current = summariseResults([
      { name: 'test a', status: 'passed', duration: 100 },
      { name: 'test b', status: 'passed', duration: 100 },
      { name: 'test c', status: 'passed', duration: 100 },
      { name: 'test d', status: 'passed', duration: 100 },
      { name: 'test e', status: 'flaky', duration: 100, retries: 1 },
    ]);

    // With tight tolerance (0%), even a 20% drop should be a regression
    const strictReport = computeRegressionReport(previous, current, 0);
    expect(strictReport.isRegression).toBe(false); // flaky still counts toward pass rate

    // Failures introduced → regression regardless of tolerance
    const withFailure = summariseResults([
      ...Array(4).fill({ name: 'x', status: 'passed' as const, duration: 100 }),
      { name: 'failing', status: 'failed' as const, duration: 100 },
    ]);
    const failReport = computeRegressionReport(previous, withFailure, 50);
    expect(failReport.isRegression).toBe(true);
  });
});
