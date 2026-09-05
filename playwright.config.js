import { defineConfig } from '@playwright/test'

// 확장은 persistent context 하나에 얹히므로 병렬로 띄우면 서로 방해한다.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000
})
