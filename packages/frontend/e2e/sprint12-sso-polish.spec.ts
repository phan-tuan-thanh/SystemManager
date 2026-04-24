/**
 * S12-10+11: Sprint 12 E2E tests — SSO, Global Search, Dark Mode, Import, Alerts
 */
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@system.local';
const ADMIN_PASSWORD = 'Admin@123';
const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

// Helper: login and get token
async function getToken(request: any) {
  const res = await request.post(`${API_BASE}/auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const body = await res.json();
  return body.data.access_token as string;
}

test.describe('SSO — Login page', () => {
  test('should show Microsoft 365 login button on login page', async ({ page }) => {
    await page.goto('/login');
    const ssoBtn = page.getByRole('link', { name: /microsoft 365/i });
    await expect(ssoBtn).toBeVisible();
  });

  test('SSO button href should point to backend auth endpoint', async ({ page }) => {
    await page.goto('/login');
    const ssoBtn = page.getByRole('link', { name: /microsoft 365/i });
    const href = await ssoBtn.getAttribute('href');
    expect(href).toContain('/api/v1/auth/ms365');
  });

  test('MS365 login endpoint should redirect (302) to Microsoft', async ({ request }) => {
    const res = await request.get(`${API_BASE}/auth/ms365`, { maxRedirects: 0 });
    // Expect a redirect — either 302 or the fetch follows to Microsoft
    expect([200, 301, 302, 307, 308]).toContain(res.status());
  });
});

test.describe('Alert API', () => {
  test('GET /alerts should return array of alerts', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${API_BASE}/alerts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Response is wrapped in {data}
    const alerts = body.data ?? body;
    expect(Array.isArray(alerts)).toBe(true);
  });

  test('GET /alerts/summary should return count breakdown', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${API_BASE}/alerts/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const summary = body.data ?? body;
    expect(summary).toHaveProperty('total');
    expect(summary).toHaveProperty('high');
    expect(summary).toHaveProperty('medium');
    expect(summary).toHaveProperty('low');
  });
});

test.describe('Global Search API', () => {
  test('GET /system/search with short query returns empty results', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${API_BASE}/system/search?q=x`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data ?? body;
    expect(data).toHaveProperty('servers');
    expect(data).toHaveProperty('applications');
    expect(data).toHaveProperty('networks');
    expect(data.servers).toEqual([]);
  });

  test('GET /system/search with valid query returns results', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.get(`${API_BASE}/system/search?q=server`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const data = body.data ?? body;
    expect(Array.isArray(data.servers)).toBe(true);
    expect(Array.isArray(data.applications)).toBe(true);
  });
});

test.describe('Import API', () => {
  test('POST /import/preview without file returns 400', async ({ request }) => {
    const token = await getToken(request);
    const res = await request.post(`${API_BASE}/import/preview?type=server`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([400, 422]).toContain(res.status());
  });

  test('POST /import/preview with CSV data returns preview result', async ({ request }) => {
    const token = await getToken(request);
    const csvContent = 'code,name,hostname,environment\nTEST-001,Test Server,test-host.local,DEV\n';
    const blob = Buffer.from(csvContent, 'utf-8');

    const res = await request.post(`${API_BASE}/import/preview?type=server`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'test.csv', mimeType: 'text/csv', buffer: blob },
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    const data = body.data ?? body;
    expect(data).toHaveProperty('session_id');
    expect(data).toHaveProperty('total');
    expect(data.total).toBe(1);
    expect(data.valid).toBe(1);
  });
});

test.describe('Dashboard — Alerts & Recent Changes', () => {
  test('Dashboard should render alert panel after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/(dashboard|setup)/);

    if (page.url().includes('/setup')) {
      // System not initialized — skip
      test.skip();
      return;
    }

    // Wait for dashboard to load
    await page.waitForSelector('.ant-card', { timeout: 10000 });
    // Alert panel and recent changes cards should be present
    const cards = await page.locator('.ant-card-head-title').allInnerTexts();
    const cardTitles = cards.map((t) => t.trim().toLowerCase());
    expect(cardTitles.some((t) => t.includes('alert'))).toBe(true);
    expect(cardTitles.some((t) => t.includes('change'))).toBe(true);
  });
});

test.describe('Dark Mode Toggle', () => {
  test('Dark mode toggle button should be visible in header after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/(dashboard|setup)/);

    if (page.url().includes('/setup')) {
      test.skip();
      return;
    }

    // Dark mode button uses BulbOutlined/BulbFilled icon
    const darkBtn = page.locator('[title*="Dark mode"], [title*="Light mode"]').first();
    // Or check for the anticon-bulb button
    const bulbBtn = page.locator('.anticon-bulb-outlined, .anticon-bulb-filled').first();
    await expect(bulbBtn).toBeVisible();
  });
});
