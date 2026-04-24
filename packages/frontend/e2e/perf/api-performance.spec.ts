/**
 * S12-10: Performance tests — API response time < 500ms
 * Run with: npx playwright test e2e/perf/
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const THRESHOLD_MS = 500;

async function getToken(request: any): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: 'admin@system.local', password: 'Admin@123' },
  });
  const body = await res.json();
  return body.data.access_token;
}

async function measureApi(request: any, token: string, path: string): Promise<number> {
  const start = Date.now();
  const res = await request.get(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const elapsed = Date.now() - start;
  expect(res.status()).toBeLessThan(400);
  return elapsed;
}

test.describe('API Performance — response time < 500ms', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getToken(request);
  });

  const endpoints = [
    '/servers?limit=20',
    '/applications?limit=20',
    '/deployments?limit=20',
    '/connections?limit=20',
    '/audit-logs?limit=20',
    '/alerts/summary',
    '/system/search?q=server',
    '/system/status',
    '/network-configs?limit=20',
    '/ports?limit=20',
  ];

  for (const endpoint of endpoints) {
    test(`GET ${endpoint} < ${THRESHOLD_MS}ms`, async ({ request }) => {
      const elapsed = await measureApi(request, token, endpoint);
      console.log(`  ${endpoint}: ${elapsed}ms`);
      expect(elapsed, `${endpoint} exceeded ${THRESHOLD_MS}ms (took ${elapsed}ms)`).toBeLessThanOrEqual(THRESHOLD_MS);
    });
  }

  test('POST /auth/login < 500ms', async ({ request }) => {
    const start = Date.now();
    await request.post(`${API_BASE}/auth/login`, {
      data: { email: 'admin@system.local', password: 'Admin@123' },
    });
    const elapsed = Date.now() - start;
    console.log(`  POST /auth/login: ${elapsed}ms`);
    expect(elapsed).toBeLessThanOrEqual(THRESHOLD_MS);
  });

  test('GraphQL topology query < 2000ms', async ({ request }) => {
    const start = Date.now();
    const res = await request.post(`${API_BASE.replace('/api/v1', '')}/graphql`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        query: `
          query {
            topology(environment: "PROD") {
              servers { id name status }
              connections { id connection_type }
            }
          }
        `,
      }),
    });
    const elapsed = Date.now() - start;
    console.log(`  GraphQL topology: ${elapsed}ms`);
    expect(res.status()).toBe(200);
    expect(elapsed, `Topology query exceeded 2000ms (took ${elapsed}ms)`).toBeLessThanOrEqual(2000);
  });
});
