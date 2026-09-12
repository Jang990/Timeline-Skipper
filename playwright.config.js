import { defineConfig } from '@playwright/test'

// 확장은 persistent context 하나에 얹히므로 병렬로 띄우면 서로 방해한다.
export default defineConfig({
  testDir: './tests',

  // Playwright 기본값은 *.test.js도 주워간다. 그대로 두면 tests/core/의 단위 테스트를
  // 크롬까지 띄워가며 돌리려 든다. 브라우저가 필요한 것만 *.spec.js로 쓴다.
  testMatch: '**/*.spec.js',

  // tests/live/는 진짜 유튜브에 붙는다. 이 설정으로는 돌리지 않는다 — playwright.live.config.js가 맡는다.
  testIgnore: '**/live/**',

  fullyParallel: false,
  workers: 1,

  // 재시도하지 않는다. 이 스위트는 네트워크를 전부 route로 끊어 결정론적이라, 재시도는
  // "핸들러가 두 번 불린다" 같은 멱등성 버그를 초록으로 덮는 것 말고 하는 일이 없다.
  retries: 0,

  // CI에서 깨지면 화면을 볼 수 없다. 실패한 것만 남긴다.
  use: { trace: 'retain-on-failure' },

  reporter: 'list',
  timeout: 30_000
})
