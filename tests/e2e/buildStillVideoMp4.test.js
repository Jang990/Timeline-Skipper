import { describe, it, expect } from 'vitest'

import { buildStillVideoMp4 } from '../../e2e/fixtures/media/buildStillVideoMp4.js'
import { FIXTURE_VIDEO_SECONDS, readFixtureVideo } from '../../e2e/fixtures/media/fixtureVideo.js'

const HOUR_SECONDS = 3600
const CHUNK_OFFSET_BYTES = 4

// 여기 둘은 크롬이 알려주지 못하는 것만 본다. 상자를 잘못 채웠는지는 크롬이 디코딩에
// 실패하면서 알려주므로(videoFixture.spec.js) 여기서 다시 확인하지 않는다.
// 낡은 mp4도 뚱뚱한 mp4도 크롬에서는 멀쩡히 재생된다. 그게 이 두 개가 있는 이유다.
describe('buildStillVideoMp4', () => {
  it('저장소에 든 영상 파일이 지금 생성기가 만드는 것과 같다', () => {
    const rebuilt = buildStillVideoMp4(FIXTURE_VIDEO_SECONDS)

    expect(readFixtureVideo().equals(rebuilt)).toBe(true)
  })

  it('영상이 길어져도 늘어나는 건 청크 표뿐이다', () => {
    const grownBytes =
      buildStillVideoMp4(HOUR_SECONDS).length - buildStillVideoMp4(FIXTURE_VIDEO_SECONDS).length

    expect(grownBytes).toBe((HOUR_SECONDS - FIXTURE_VIDEO_SECONDS) * CHUNK_OFFSET_BYTES)
  })
})
