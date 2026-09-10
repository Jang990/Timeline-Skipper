import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`

test.describe('시각 클릭 이동', () => {
  test('트랙의 시각을 누르면 그 트랙의 시작으로 옮긴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await clickTrackTime(page, 2)

    await expect.poll(() => readCurrentTimeSeconds(page)).toBe(556)
  })

  test('뒤쪽에 있다가 앞 트랙의 시각을 누르면 그 트랙 시작으로 되돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, 1000)

    await clickTrackTime(page, 1)

    await expect.poll(() => readCurrentTimeSeconds(page)).toBe(269)
  })

  // 재생이 이어졌다면 재생 위치가 트랙 시작을 지나간다. 멈췄다면 시작에 머문다.
  test('재생 중에 시각을 누르면 그 트랙의 시작부터 재생이 이어진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, 100)
    await page.evaluate(() => document.querySelector('video').play())

    await clickTrackTime(page, 2)

    await expect.poll(() => readCurrentTimeSeconds(page)).toBeGreaterThan(556)
    expect(await readCurrentTimeSeconds(page)).toBeLessThan(566)
    expect(await isPaused(page)).toBe(false)
  })
})

// 탐색은 영상 길이를 안 뒤에만 먹힌다. 불러오기 전에 그것부터 기다린다.
async function loadTimeline(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}

async function clickTrackTime(page, trackIndex) {
  await page.locator(ROW).nth(trackIndex).locator('.timeline-skip-time').click()
}

// 탐색이 끝나 확장이 그 자리를 처리한 뒤에 다음 조작으로 넘어간다. 확장은 document에서 캡처로
// 듣기 때문에 video에 단 이 리스너가 불릴 때는 확장의 처리가 이미 끝나 있다.
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

function isPaused(page) {
  return page.evaluate(() => document.querySelector('video').paused)
}

function readCurrentTimeSeconds(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}
