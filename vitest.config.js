import { defineConfig } from 'vitest/config'

// vitest 기본값은 어디에 있든 *.spec.js까지 주워간다. 그대로 두면 Playwright용 e2e를
// vitest가 실행하려다 실패한다. 수집 범위를 tests/ 안으로 못박는다.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js']
  }
})
