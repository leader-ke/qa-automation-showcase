/**
 * k6 — Smoke test
 *
 * Strategy: a smoke test runs at minimal load (1 VU, 1 iteration) to verify
 * the system is up and responding correctly before any load is applied.
 * Run this first — if it fails, there is no point running the load test.
 *
 * Target: https://jsonplaceholder.typicode.com
 */
import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate==0'],
    errors: ['rate==0'],
  },
};

const BASE_URL = 'https://jsonplaceholder.typicode.com';

export default function () {
  group('GET /posts', () => {
    const res = http.get(`${BASE_URL}/posts`);

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'response is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
      'body is an array': (r) => Array.isArray(JSON.parse(r.body)),
      'returns at least one post': (r) => JSON.parse(r.body).length > 0,
    });

    errorRate.add(!ok);
  });

  group('GET /users', () => {
    const res = http.get(`${BASE_URL}/users`);

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'returns users': (r) => JSON.parse(r.body).length > 0,
    });

    errorRate.add(!ok);
  });

  group('GET /posts/:id', () => {
    const res = http.get(`${BASE_URL}/posts/1`);

    const ok = check(res, {
      'status is 200': (r) => r.status === 200,
      'returns correct post': (r) => JSON.parse(r.body).id === 1,
    });

    errorRate.add(!ok);
  });
}
