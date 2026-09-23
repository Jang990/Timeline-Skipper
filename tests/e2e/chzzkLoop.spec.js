import { test, expect } from '../fixtures/extensionContext.js'

// 유튜브는 영상이 끝나도 ended를 쏘지 않아 플레이어 클래스를 감시한다. 치지직은 표준 이벤트를 준다.
// 가짜 플레이어로는 이 차이가 드러나지 않으므로 진짜 <video>가 끝나는 것을 본다.
//
// 목록은 한 줄 추가로 만든다. 치지직 댓글에서 불러오는 것은 아직 다루지 않는다.
const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const QUICK_INPUT = `${PANEL} .timeline-skip-quick-input`
const LOOP_ON_BUTTON = `${PANEL} [aria-label="반복 켜기"]`
const LOOP_OFF_BUTTON = `${PANEL} [aria-label="반복 끄기"]`

const FIRST_TRACK_SECONDS = 5

test.describe('치지직 반복 재생', () => {
  test('영상이 끝나면 첫 트랙 시작으로 돌아가 이어서 재생한다', async ({ openChzzkPage }) => {
    const { page } = await openChzzkPage()
    await addTrack(page, '0:05 첫곡')
    await turnOnLoop(page)

    await playToEnd(page)

    await expect.poll(() => readCurrentTimeSeconds(page), { timeout: 10_000 }).toBeLessThan(60)
    await expect
      .poll(() => readCurrentTimeSeconds(page), { timeout: 10_000 })
      .toBeGreaterThan(FIRST_TRACK_SECONDS + 0.3)
    expect(await page.evaluate(() => document.querySelector('video').paused)).toBe(false)
  })
})

async function addTrack(page, text) {
  await expect(page.locator(QUICK_INPUT)).toBeVisible()

  await page.locator(QUICK_INPUT).fill(text)
  await page.locator(QUICK_INPUT).press('Enter')

  await expect(page.locator(ROW).first()).toBeVisible()
}

async function turnOnLoop(page) {
  await page.locator(LOOP_ON_BUTTON).click()
  await expect(page.locator(LOOP_OFF_BUTTON)).toBeVisible()
}

// 픽스처 영상은 30분이다. 끝 바로 앞으로 옮겨 재생하면 잠깐 뒤에 진짜 ended가 난다.
async function playToEnd(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.evaluate(() => {
    const video = document.querySelector('video')

    video.currentTime = video.duration - 0.3
    video.play()
  })
}

function readCurrentTimeSeconds(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}
