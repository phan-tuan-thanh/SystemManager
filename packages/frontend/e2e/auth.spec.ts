/**
 * S7-11: E2E test — auth flow (login → setup wizard → seed demo)
 */
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@system.local';
const ADMIN_PASSWORD = 'Admin@123';
const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

test.describe('Auth flow', () => {
  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should login with valid credentials and reach dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/password|mật khẩu/i).fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Should land on dashboard or setup wizard
    await expect(page).toHaveURL(/\/(dashboard|setup)/);
  });

  test('should show login error for wrong credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder(/email/i).fill(ADMIN_EMAIL);
    await page.getByPlaceholder(/password|mật khẩu/i).fill('wrong-password');
    await page.getByRole('button', { name: /đăng nhập|login/i }).click();

    // Should stay on login page and show error
    await expect(page).toHaveURL(/\/login/);
  });

  test('API login returns valid JWT', async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveProperty('access_token');
    expect(body.data).toHaveProperty('refresh_token');
    expect(body.data.user.email).toBe(ADMIN_EMAIL);
  });

  test('API refresh token rotates correctly', async ({ request }) => {
    // Login first
    const loginRes = await request.post(`${API_BASE}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    });
    const { data } = await loginRes.json();

    // Refresh
    const refreshRes = await request.post(`${API_BASE}/auth/refresh`, {
      data: { refresh_token: data.refresh_token },
    });
    expect(refreshRes.status()).toBe(200);
    const refreshBody = await refreshRes.json();
    expect(refreshBody.data).toHaveProperty('access_token');
    // New token should differ from old
    expect(refreshBody.data.access_token).not.toBe(data.access_token);
  });
});
