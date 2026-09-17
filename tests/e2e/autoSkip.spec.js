import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const CHECKBOX = 'input[type="checkbox"]'

test.describe('자동 스킵', () => {
  test('재생 중 체크를 해제한 트랙에 닿으면 그 트랙을 건너뛴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await seekAndSettle(page, 266)

    await page.evaluate(() => document.querySelector('video').play())

    // 재생으로 556초에 닿으려면 290초가 걸린다. 몇 초 안에 닿았다면 건너뛴 것이다.
    await expect.poll(() => readCurrentTimeSeconds(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(556)
    expect(await readCurrentTimeSeconds(page)).toBeLessThan(566)
  })
})

// 영상 길이를 모르는 채로 불러오면 마지막 트랙의 끝이 비어 있다. 길이를 안 뒤에 불러온다.
async function loadTimeline(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}

async function disableTrack(page, trackIndex) {
  const row = page.locator(ROW).nth(trackIndex)

  await row.locator(CHECKBOX).click()
  await expect(row).toHaveClass(/is-disabled/)
}

// 스킵은 timeupdate를 받아서 일어난다. 이벤트를 기다리지 않고 읽으면 "제자리에 있다"는 단언이 기다림 없이
// 초록이 된다. 확장은 document에서 캡처로 듣기 때문에 video에 단 이 리스너가 불릴 때는
// 확장의 처리가 이미 끝나 있다.
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

function readCurrentTimeSeconds(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}
