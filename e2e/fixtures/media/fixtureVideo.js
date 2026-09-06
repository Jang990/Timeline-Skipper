import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// 댓글을 30분까지만 쓰기로 했으므로 영상도 30분이면 된다.
// 길이를 바꾸려면 이 값을 고치고 makeFixtureVideo.js를 다시 실행한다.
export const FIXTURE_VIDEO_SECONDS = 1800
export const FIXTURE_VIDEO_URL = '/fixture-1800s.mp4'
export const FIXTURE_VIDEO_PATH = fileURLToPath(new URL('./fixture-1800s.mp4', import.meta.url))

export function readFixtureVideo () {
  return readFileSync(FIXTURE_VIDEO_PATH)
}
