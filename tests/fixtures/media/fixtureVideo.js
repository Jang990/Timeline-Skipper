import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// 댓글을 30분까지만 쓰기로 했으므로 영상도 30분이면 된다.
// 길이를 바꾸려면 이 값을 고치고 makeFixtureVideo.js를 다시 실행한다.
export const FIXTURE_VIDEO_SECONDS = 1800
export const FIXTURE_VIDEO_URL = '/fixture-1800s.mp4'
// jsdom 테스트도 길이를 읽는다. 그 환경의 전역 URL은 jsdom의 것이라 node의 URL 도구와 섞이지 않아
// URL 객체를 만들지 않고 파일 경로로 계산한다.
export const FIXTURE_VIDEO_PATH = resolve(dirname(fileURLToPath(import.meta.url)), 'fixture-1800s.mp4')

export function readFixtureVideo () {
  return readFileSync(FIXTURE_VIDEO_PATH)
}
