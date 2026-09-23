import { describe, it, expect } from 'vitest'

import { PLATFORM_PROFILES, selectProfile } from '../../src/adapters/platformProfiles.js'

// 확장이 도는 플랫폼마다 다른 것은 셀렉터와 영상 ID를 읽는 법뿐이다. 그 둘을 한 곳에 모아
// 호스트로 고른다. 프로필에 값이 하나 빠지면 그 플랫폼에서만 조용히 실패하므로 이름을 맞춰 본다.
describe('플랫폼 프로필', () => {
  it('chzzk.naver.com에는 치지직 프로필을 고른다', () => {
    expect(selectProfile('chzzk.naver.com')).toBe(PLATFORM_PROFILES.chzzk)
  })

  it('치지직이 아닌 호스트에는 유튜브 프로필을 고른다', () => {
    expect(selectProfile('www.youtube.com')).toBe(PLATFORM_PROFILES.youtube)
    expect(selectProfile('localhost')).toBe(PLATFORM_PROFILES.youtube)
  })

  it('두 프로필이 같은 이름의 셀렉터를 모두 갖는다', () => {
    const youtubeNames = Object.keys(PLATFORM_PROFILES.youtube.selectors).sort()

    const chzzkNames = Object.keys(PLATFORM_PROFILES.chzzk.selectors).sort()

    expect(chzzkNames).toEqual(youtubeNames)
  })

  // 프로필에 값이 하나 빠지면 그 플랫폼에서만 조용히 실패한다.
  // 값이 맞는지는 실제 재생으로 e2e가 본다.
  it('두 프로필이 같은 이름의 값을 모두 갖는다', () => {
    const youtubeNames = Object.keys(PLATFORM_PROFILES.youtube).sort()

    const chzzkNames = Object.keys(PLATFORM_PROFILES.chzzk).sort()

    expect(chzzkNames).toEqual(youtubeNames)
  })

  it('유튜브 주소의 v 값을 영상 ID로 읽는다', () => {
    const videoId = PLATFORM_PROFILES.youtube.videoIdFrom(new URL('https://www.youtube.com/watch?v=3yG8GXdnEFQ'))

    expect(videoId).toBe('3yG8GXdnEFQ')
  })

  it('치지직 주소의 경로 마지막 칸을 영상 ID로 읽는다', () => {
    const videoId = PLATFORM_PROFILES.chzzk.videoIdFrom(new URL('https://chzzk.naver.com/video/9366573'))

    expect(videoId).toBe('9366573')
  })

  it('시청 페이지가 아닌 유튜브 주소에서는 영상 ID가 null이다', () => {
    const videoId = PLATFORM_PROFILES.youtube.videoIdFrom(new URL('https://www.youtube.com/'))

    expect(videoId).toBeNull()
  })

  // 치지직은 다시보기 말고 라이브·채널 페이지에서도 주소가 바뀐다. 경로 마지막 칸을 그냥 쓰면
  // 채널 ID를 영상 ID로 잘못 읽어 엉뚱한 목록을 저장한다.
  it('다시보기가 아닌 치지직 주소에서는 영상 ID가 null이다', () => {
    const { videoIdFrom } = PLATFORM_PROFILES.chzzk

    expect(videoIdFrom(new URL('https://chzzk.naver.com/'))).toBeNull()
    expect(videoIdFrom(new URL('https://chzzk.naver.com/live/abcdef123456'))).toBeNull()
  })
})
