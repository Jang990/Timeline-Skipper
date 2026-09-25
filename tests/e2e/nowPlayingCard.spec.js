import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다.
// 1100초는 다섯 번째, 1300초는 여섯 번째 트랙 안이고, 0.5초는 첫 트랙 앞이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const CARD = `${PANEL} .timeline-skip-now-playing`
const CARD_LABEL = `${CARD} .timeline-skip-now-playing-label`
const CARD_TITLE = `${CARD} .timeline-skip-now-playing-title`

test.describe('지금 재생 중 카드', () => {
  test('재생 중인 트랙의 제목과 순번이 카드에 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await seekAndSettle(page, 1100)

    await expect(page.locator(CARD_LABEL)).toContainText('5번째 트랙')
    await expect(page.locator(CARD_TITLE)).toHaveText(await readRowTitle(page, 4))
  })

})

function readRowTitle(page, trackIndex) {
  return page.locator(ROW).nth(trackIndex).locator('.timeline-skip-title').textContent()
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
