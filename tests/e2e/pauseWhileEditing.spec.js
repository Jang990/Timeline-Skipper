import { test, expect } from '../fixtures/extensionContext.js'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초이고, 마지막 트랙은 영상 끝에서 끝난다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`

test.describe('편집 중 건너뛰기와 반복 멈춤', () => {
  test('편집 행이 열려 있으면 체크 해제된 트랙 안으로 옮겨도 그 자리에 머문다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await openEditRow(page, 3)

    const currentTimeSeconds = await seekAndSettle(page, 300)

    expect(currentTimeSeconds).toBe(300)
  })

  test('편집 행이 열려 있으면 트랙 사이 빈 구간으로 옮겨도 그 자리에 머문다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await openEditRow(page, 0)
    await page.locator(END_INPUT).fill('03:00')
    await clickPanelButton(page, '저장')
    await openEditRow(page, 2)

    // 첫 트랙의 끝을 180초로 당겨 두었으니 180~269초가 빈 구간이다.
    const currentTimeSeconds = await seekAndSettle(page, 200)

    expect(currentTimeSeconds).toBe(200)
  })

  test('편집 행이 열려 있으면 반복이 켜져 있어도 영상 끝에서 되감지 않는다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await clickPanelButton(page, '반복 켜기')
    await openEditRow(page, 2)

    const currentTimeSeconds = await seekAndSettle(page, FIXTURE_VIDEO_SECONDS)

    expect(currentTimeSeconds).toBeGreaterThan(FIXTURE_VIDEO_SECONDS - 1)
  })

  test('추가 행이 열려 있어도 체크 해제된 트랙 안에 머문다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await page.locator(`${PANEL} .timeline-skip-add`).click()
    await expect(page.locator(START_INPUT)).toBeVisible()

    const currentTimeSeconds = await seekAndSettle(page, 300)

    expect(currentTimeSeconds).toBe(300)
  })

  test('편집을 취소하면 다시 건너뛴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await openEditRow(page, 3)

    await clickPanelButton(page, '취소')
    const currentTimeSeconds = await seekAndSettle(page, 300)

    expect(currentTimeSeconds).toBe(556)
  })

  test('편집을 저장하면 다시 건너뛴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await openEditRow(page, 3)

    await clickPanelButton(page, '저장')
    const currentTimeSeconds = await seekAndSettle(page, 300)

    expect(currentTimeSeconds).toBe(556)
  })
})

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

// 편집 행이 열리면 그 행이 폼으로 바뀌어 행 순서가 흔들린다. 열기 전에만 순번으로 찾는다.
async function openEditRow(page, trackIndex) {
  await page.locator(ROW).nth(trackIndex).locator('button[aria-label$=" 수정"]').click()
  await expect(page.locator(START_INPUT)).toBeVisible()
}

async function clickPanelButton(page, ariaLabel) {
  await page.locator(`${PANEL} button[aria-label="${ariaLabel}"]`).click()
}

// 스킵은 timeupdate를 받아서 일어난다. 이벤트를 기다리지 않고 읽으면 "머문다"가 기다림 없이
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
