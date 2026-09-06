import { defineConfig } from 'vitest/config'

// vitest 기본값은 *.spec.js까지 주워간다. 그대로 두면 브라우저가 필요한 spec을
// vitest가 실행하려다 실패한다. 두 러너는 확장자로 갈린다 — vitest는 *.test.js,
// Playwright는 *.spec.js. 같은 디렉토리에 나란히 있어도 서로 넘보지 않는다.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.js']
  }
})
