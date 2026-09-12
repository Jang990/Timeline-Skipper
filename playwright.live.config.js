import { defineConfig } from '@playwright/test'

// 이 스위트만 실제 유튜브에 접속한다. 픽스처 e2e와 한 설정에 두면 유튜브 사정으로
// PR CI가 빨간불이 된다. 실패가 "이 PR이 뭘 깨뜨렸다"로 읽히면 안 되므로 설정부터 가른다.
export default defineConfig({
  testDir: './tests/live',
  testMatch: '**/*.spec.js',

  fullyParallel: false,
  workers: 1,

  // 픽스처와 달리 여기는 네트워크에 매인다. 접속 한 번 실패한 것을 "유튜브가 바뀌었다"로
  // 보고하지 않도록 한 번만 다시 해 본다.
  retries: 1,

  // 실제 시청 페이지는 광고와 추천 영상까지 내려온다. 픽스처보다 넉넉히 준다.
  timeout: 120_000,

  use: { trace: 'retain-on-failure' },
  reporter: 'list'
})
