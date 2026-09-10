import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 같은 버튼이 플로팅 위젯에도 있다. 위젯 쪽은 floating.spec.js가 다루므로 여기서는 패널로 좁힌다.
const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const PLAY_BUTTON = `${PANEL} [aria-label="재생"]`
const PAUSE_BUTTON = `${PANEL} [aria-label="일시정지"]`
const NEXT_BUTTON = `${PANEL} [aria-label="다음 트랙"]`
const PREVIOUS_BUTTON = `${PANEL} [aria-label="이전 트랙"]`

test.describe('패널 재생 조작', () => {
  test('▶를 누르면 재생되고 버튼이 ⏸로 바뀐다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await page.locator(PLAY_BUTTON).click()

    await expect(page.locator(PAUSE_BUTTON)).toHaveText('⏸')
    expect(await isPaused(page)).toBe(false)
  })

  test('⏸를 누르면 멈추고 버튼이 ▶로 돌아온다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await page.locator(PLAY_BUTTON).click()
    await expect(page.locator(PAUSE_BUTTON)).toBeVisible()

    await page.locator(PAUSE_BUTTON).click()

    await expect(page.locator(PLAY_BUTTON)).toHaveText('▶')
    expect(await isPaused(page)).toBe(true)
  })

  test('⏭은 다음 트랙 시작으로 옮긴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, 100)

    await page.locator(NEXT_BUTTON).click()

    await expect.poll(() => readCurrentTimeSeconds(page)).toBe(269)
  })

  test('⏭은 체크를 해제한 트랙을 건너뛰고 그다음 체크된 트랙으로 옮긴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await seekAndSettle(page, 100)

    await page.locator(NEXT_BUTTON).click()

    await expect.poll(() => readCurrentTimeSeconds(page)).toBe(556)
  })

  test('⏮은 곡 중간에서 누르면 그 곡의 시작으로 옮긴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, 300)

    await page.locator(PREVIOUS_BUTTON).click()

    await expect.poll(() => readCurrentTimeSeconds(page)).toBe(269)
  })

  test('⏮은 곡 시작 3초 안에서 누르면 이전 트랙 시작으로 옮긴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, 270)

    await page.locator(PREVIOUS_BUTTON).click()

    await expect.poll(() => readCurrentTimeSeconds(page)).toBe(1)
  })

  // 클릭 핸들러는 재생 위치를 동기로 옮긴다. click()이 끝난 뒤 읽는 값은 핸들러가 지나간 뒤의 값이다.
  test('마지막 트랙에서 ⏭을 누르면 재생 위치가 그대로다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, 1797)

    await page.locator(NEXT_BUTTON).click()

    expect(await readCurrentTimeSeconds(page)).toBe(1797)
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

async function disableTrack(page, trackIndex) {
  const row = page.locator(ROW).nth(trackIndex)

  await row.locator('input[type="checkbox"]').click()
  await expect(row).toHaveClass(/is-disabled/)
}

// 탐색이 끝나 확장이 그 자리를 처리한 뒤에 버튼을 누른다. 확장은 document에서 캡처로 듣기
// 때문에 video에 단 이 리스너가 불릴 때는 확장의 처리가 이미 끝나 있다.
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
