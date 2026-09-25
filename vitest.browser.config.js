import { defineConfig } from 'vitest/config'

// 확장을 설치하지 않고 패널만 진짜 브라우저에 띄워, 크기·위치·색처럼 화면을 그려야 가려지는 것을 본다.
// viewport는 e2e와 같게 둔다. 폭이 다르면 같은 CSS라도 줄바꿈과 위치가 달라진다.
export default defineConfig({
  test: {
    include: ['tests/browser/**/*.test.js'],
    browser: {
      enabled: true,
      provider: 'playwright',
      headless: true,
      viewport: { width: 1280, height: 720 },
      screenshotFailures: false,
      instances: [{ browser: 'chromium' }]
    }
  }
})
