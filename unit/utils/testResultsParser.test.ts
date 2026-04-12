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
    const results: TestResult[] = [
      { name: 'test a', status: 'passed', duration: 100 },
    ];
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
    const { fast, slow } = categoriseByDuration(mockResults, 1000);

    expect(slow.length).toBe(2); // checkout (1200ms) and profile update (4500ms)
  });
});
