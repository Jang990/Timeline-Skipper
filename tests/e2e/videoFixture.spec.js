import { test, expect } from '../fixtures/extensionContext.js'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'

// 아래 spec들은 전부 이 영상 위에서 돈다. 여기가 깨지면 나머지 실패는 원인이 아니라 증상이다.
test.describe('픽스처 영상', () => {
  test('30분 길이로 로드된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    await expect
      .poll(() => page.evaluate(() => document.querySelector('video').duration))
      .toBe(FIXTURE_VIDEO_SECONDS)
  })

  test('재생 오류 없이 디코딩된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    await expect
      .poll(() => page.evaluate(() => document.querySelector('video').readyState))
      .toBeGreaterThanOrEqual(2)

    expect(await page.evaluate(() => document.querySelector('video').error)).toBeNull()
  })

  test('임의의 시각으로 탐색할 수 있다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    await expect
      .poll(() => page.evaluate(() => document.querySelector('video').readyState))
      .toBeGreaterThanOrEqual(1)

    const currentTimeSeconds = await page.evaluate(() => {
      const video = document.querySelector('video')
      video.currentTime = 1234

      return video.currentTime
    })

    expect(currentTimeSeconds).toBe(1234)
  })
})
