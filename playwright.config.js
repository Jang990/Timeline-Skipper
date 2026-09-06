import { defineConfig } from '@playwright/test'

// 확장은 persistent context 하나에 얹히므로 병렬로 띄우면 서로 방해한다.
export default defineConfig({
  testDir: './tests',

  // Playwright 기본값은 *.test.js도 주워간다. 그대로 두면 tests/core/의 단위 테스트를
  // 크롬까지 띄워가며 돌리려 든다. 브라우저가 필요한 것만 *.spec.js로 쓴다.
  testMatch: '**/*.spec.js',

  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30_000
})
