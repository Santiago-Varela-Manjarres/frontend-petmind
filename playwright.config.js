import { defineConfig } from '@playwright/test'

// Prueba de punta a punta del flujo de adopción (e2e/flujo-adopcion.spec.js).
// Por defecto corre contra el sitio publicado. Con E2E_BASE_URL=http://localhost:5173 levanta Vite en local,
// que usa el backend de .env.local (el backend solo acepta CORS de localhost:5173 y de Vercel).
const baseURL = (process.env.E2E_BASE_URL ?? 'https://frontend-petmind.vercel.app').replace(/\/$/, '')
const local = /^http:\/\/localhost(:\d+)?$/.test(baseURL)

export default defineConfig({
  testDir: './e2e',
  // El backend y la API de analítica están en el plan gratuito de Render: si estaban dormidos tardan en despertar.
  timeout: 15 * 60_000,
  expect: { timeout: 30_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    viewport: { width: 1280, height: 720 },
    actionTimeout: 30_000,
    navigationTimeout: 120_000,
  },
  webServer: local
    ? {
        command: `npm run dev -- --port ${new URL(baseURL).port || 5173} --strictPort`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      }
    : undefined,
})
