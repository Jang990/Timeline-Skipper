import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다.
// 다섯 번째 트랙은 1026초(17:06)부터 1253초(20:53)까지 227초다. 0.5초는 첫 트랙 앞이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const PROGRESS = `${PANEL} .timeline-skip-now-playing .timeline-skip-now-playing-progress`
const BAR = `${PROGRESS} .timeline-skip-now-playing-bar`
const FILL = `${BAR} .timeline-skip-now-playing-fill`
const TRACK_START_SECONDS = 1026
const TRACK_LENGTH_SECONDS = 227

// 폭은 픽셀로 잰다. 반올림과 테두리 몫만큼은 어긋날 수 있다.
const RATIO_TOLERANCE = 0.02

test.describe('지금 재생 중 진행 바', () => {
  test('진행 바는 트랙 안에서 흐른 비율만큼 채워진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await seekAndSettle(page, secondsAtRatio(0.5))

    await expectFillRatio(page, 0.5)
  })
})

function secondsAtRatio(ratio) {
  return TRACK_START_SECONDS + TRACK_LENGTH_SECONDS * ratio
}

async function expectFillRatio(page, expectedRatio) {
  await expect
    .poll(async () => {
      const bar = await page.locator(BAR).boundingBox()
      const fill = await page.locator(FILL).boundingBox()

      return Math.abs(fill.width / bar.width - expectedRatio)
    })
    .toBeLessThanOrEqual(RATIO_TOLERANCE)
}

// 탐색은 영상 길이를 안 뒤에만 먹힌다. 불러오기 전에 그것부터 기다린다.
async function loadTimeline(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}

function seekAndSettle(page, timestampSeconds) {
  return page.evaluate(
    (seconds) =>
      new Promise((resolve) => {
        const video = document.querySelector('video')

        video.addEventListener('timeupdate', () => resolve(video.currentTime), { once: true })
        video.currentTime = seconds
      }),
    timestampSeconds
  )
}
