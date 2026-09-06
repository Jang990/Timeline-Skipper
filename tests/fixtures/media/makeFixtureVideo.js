import { writeFileSync } from 'node:fs'

import { buildStillVideoMp4 } from './buildStillVideoMp4.js'
import { FIXTURE_VIDEO_PATH, FIXTURE_VIDEO_SECONDS } from './fixtureVideo.js'

// 결과물(fixture-1800s.mp4)은 저장소에 함께 넣는다. 이 스크립트는 그 파일이 어디서 왔는지를
// 남기고, 길이를 바꿔야 할 때 다시 만들기 위한 것이다. 테스트가 이 파일을 부르지는 않는다.
//
//   node e2e/fixtures/media/makeFixtureVideo.js
const buffer = buildStillVideoMp4(FIXTURE_VIDEO_SECONDS)

writeFileSync(FIXTURE_VIDEO_PATH, buffer)

console.log(`${FIXTURE_VIDEO_PATH} — ${FIXTURE_VIDEO_SECONDS}초, ${buffer.length}바이트`)
