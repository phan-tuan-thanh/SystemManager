/**
 * S7-12: E2E test — CRUD flow: server → hardware → network → app → deployment
 * Uses API directly (backend HTTP) to avoid UI flakiness.
 * Assumes system is seeded (POST /system/initialize + POST /system/seed-demo already done).
 */
import { test, expect } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';
const ADMIN_EMAIL = 'admin@system.local';
const ADMIN_PASSWORD = 'Admin@123';

async function login(request: any): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const body = await res.json();
  return body.data.access_token;
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}

test.describe('CRUD flow — Server → Hardware → Network → App → Deployment', () => {
  let token: string;
  let serverId: string;
  let hardwareId: string;
  let networkId: string;
  let appGroupId: string;
  let appId: string;
  let deploymentId: string;

  test.beforeAll(async ({ request }) => {
    token = await login(request);
  });

  test('1. Create server', async ({ request }) => {
    const res = await request.post(`${API_BASE}/servers`, {
      headers: auth(token),
      data: {
        code: `E2E-SRV-${Date.now()}`,
        name: 'E2E Test Server',
        hostname: 'e2e-test.internal',
        environment: 'DEV',
        purpose: 'APP_SERVER',
        infra_type: 'VIRTUAL_MACHINE',
        site: 'DC',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    serverId = body.data.id;
    expect(serverId).toBeTruthy();
  });

  test('2. Add hardware to server', async ({ request }) => {
    const res = await request.post(`${API_BASE}/hardware`, {
      headers: auth(token),
      data: {
        server_id: serverId,
        type: 'CPU',
        model: 'Intel Xeon E5',
        manufacturer: 'Intel',
        specs: { cores: 8, threads: 16 },
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    hardwareId = body.data.id;
    expect(hardwareId).toBeTruthy();
  });

  test('3. Add network config to server', async ({ request }) => {
    const uniqueIp = `10.99.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
    const res = await request.post(`${API_BASE}/network-configs`, {
      headers: auth(token),
      data: {
        server_id: serverId,
        interface: 'eth0',
        private_ip: uniqueIp,
        domain: 'e2e-test.internal',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    networkId = body.data.id;
    expect(networkId).toBeTruthy();
  });

  test('4. Create application group', async ({ request }) => {
    const res = await request.post(`${API_BASE}/app-groups`, {
      headers: auth(token),
      data: { code: `E2E-GRP-${Date.now()}`, name: 'E2E Test Group' },
    });
    expect(res.status()).toBe(201);
    appGroupId = res.json().then((b: any) => b.data.id);
    const body = await res.json();
    appGroupId = body.data.id;
  });

  test('5. Create application', async ({ request }) => {
    const res = await request.post(`${API_BASE}/applications`, {
      headers: auth(token),
      data: {
        group_id: appGroupId,
        code: `E2E-APP-${Date.now()}`,
        name: 'E2E Test Application',
        version: '1.0.0',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    appId = body.data.id;
    expect(appId).toBeTruthy();
  });

  test('6. Create deployment', async ({ request }) => {
    const res = await request.post(`${API_BASE}/deployments`, {
      headers: auth(token),
      data: {
        application_id: appId,
        server_id: serverId,
        environment: 'DEV',
        version: '1.0.0',
        status: 'RUNNING',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    deploymentId = body.data.id;
    expect(deploymentId).toBeTruthy();
  });

  test('7. Get server detail includes deployment', async ({ request }) => {
    const res = await request.get(`${API_BASE}/servers/${serverId}`, {
      headers: auth(token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.app_deployments.some((d: any) => d.id === deploymentId)).toBeTruthy();
  });

  test('8. Soft-delete deployment', async ({ request }) => {
    const res = await request.delete(`${API_BASE}/deployments/${deploymentId}`, {
      headers: auth(token),
    });
    expect(res.status()).toBe(204);
  });

  test('9. Soft-delete server (cleanup)', async ({ request }) => {
    const res = await request.delete(`${API_BASE}/servers/${serverId}`, {
      headers: auth(token),
    });
    expect(res.status()).toBe(204);
  });
});
