/**
 * k6 — Load test
 *
 * Strategy: simulates realistic concurrent usage ramping up to peak load,
 * holding it, then ramping back down. Thresholds define what "passing" means
 * so CI can fail if performance degrades.
 *
 * Stages:
 *   0 → 10 VUs over 30s  (ramp up)
 *   10 VUs for 1 min      (sustain)
 *   10 → 0 VUs over 10s  (ramp down)
 *
 * Target: https://jsonplaceholder.typicode.com
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

export const errorRate = new Rate('errors');
export const postListDuration = new Trend('post_list_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'], // less than 1% failure rate
    errors: ['rate<0.05'], // less than 5% check failures
    post_list_duration: ['p(99)<1000'], // 99th percentile under 1s
  },
};

const BASE_URL = 'https://jsonplaceholder.typicode.com';

export default function () {
  group('list posts', () => {
    const res = http.get(`${BASE_URL}/posts`);
    postListDuration.add(res.timings.duration);

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time under 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!ok);
  });

  group('get single post', () => {
    const id = Math.floor(Math.random() * 100) + 1;
    const res = http.get(`${BASE_URL}/posts/${id}`);

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'has expected fields': (r) => {
        const body = JSON.parse(r.body);
        return body.id && body.title && body.body && body.userId;
      },
    });

    errorRate.add(!ok);
  });

  group('create post', () => {
    const res = http.post(
      `${BASE_URL}/posts`,
      JSON.stringify({ title: 'Load test post', body: 'Generated during load test', userId: 1 }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    const ok = check(res, {
      'status is 201': (r) => r.status === 201,
    });

    errorRate.add(!ok);
  });

  sleep(1);
}
