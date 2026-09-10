import { test, expect } from '../fixtures/extensionContext.js'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초이고, 마지막 트랙은 영상 끝에서 끝난다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 같은 버튼이 플로팅 위젯에도 있다. 위젯 쪽은 floating.spec.js가 다루므로 여기서는 패널로 좁힌다.
const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const LOOP_ON_BUTTON = `${PANEL} [aria-label="반복 켜기"]`
const LOOP_OFF_BUTTON = `${PANEL} [aria-label="반복 끄기"]`

test.describe('반복 재생', () => {
  test('🔁를 누르면 반복이 켜지고 버튼이 켜진 모양으로 바뀐다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await page.locator(LOOP_ON_BUTTON).click()

    await expect(page.locator(LOOP_OFF_BUTTON)).toHaveClass(/is-active/)
  })

  test('반복을 켜면 영상 끝으로 옮긴 재생 위치가 첫 트랙 시작으로 돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await turnOnLoop(page)

    const currentTimeSeconds = await seekAndSettle(page, FIXTURE_VIDEO_SECONDS)

    expect(currentTimeSeconds).toBe(1)
  })

  // 마지막 트랙의 끝이 곧 영상의 끝이다. 영상이 멈추는 그 순간에 되감기가 일어나야 한다.
  test('반복을 켜고 재생하면 마지막 트랙이 끝날 때 첫 트랙 시작으로 돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await turnOnLoop(page)
    await seekAndSettle(page, 1797)

    await page.evaluate(() => document.querySelector('video').play())

    await expect.poll(() => readCurrentTimeSeconds(page), { timeout: 10_000 }).toBeLessThan(10)
  })

  // 반복이 없으면 같은 자리에서 영상 끝으로 간다(autoSkip.spec.js). 반복이 스킵보다 먼저라는 것을
  // 이 차이가 보여준다.
  test('마지막 트랙을 해제하고 반복을 켜면 그 앞 트랙이 끝날 때 첫 트랙 시작으로 돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 7)
    await turnOnLoop(page)

    const currentTimeSeconds = await seekAndSettle(page, 1796)

    expect(currentTimeSeconds).toBe(1)
  })

  test('첫 트랙을 해제하고 반복을 켜면 둘째 트랙 시작으로 돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 0)
    await turnOnLoop(page)

    const currentTimeSeconds = await seekAndSettle(page, FIXTURE_VIDEO_SECONDS)

    expect(currentTimeSeconds).toBe(269)
  })

  test('반복을 끄면 영상 끝으로 옮긴 재생 위치가 그대로다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await turnOnLoop(page)
    await turnOffLoop(page)

    const currentTimeSeconds = await seekAndSettle(page, FIXTURE_VIDEO_SECONDS)

    expect(currentTimeSeconds).toBe(FIXTURE_VIDEO_SECONDS)
  })

  test('반복 상태는 새로고침한 뒤에도 유지된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await turnOnLoop(page)

    await reloadWatchPage(page)

    await expect(page.locator(LOOP_OFF_BUTTON)).toHaveClass(/is-active/)
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

  await row.locator('input[type="checkbox"]').click()
  await expect(row).toHaveClass(/is-disabled/)
}

async function turnOnLoop(page) {
  await page.locator(LOOP_ON_BUTTON).click()
  await expect(page.locator(LOOP_OFF_BUTTON)).toBeVisible()
}

async function turnOffLoop(page) {
  await page.locator(LOOP_OFF_BUTTON).click()
  await expect(page.locator(LOOP_ON_BUTTON)).toBeVisible()
}

// 저장은 끝나기를 기다려 주지 않는다. 목록이 되살아난 것을 본 다음에 검증해야
// 저장이 늦은 것과 상태가 틀린 것이 구분된다.
async function reloadWatchPage(page) {
  await page.reload()
  await expect(page.locator(ROW).first()).toBeVisible()
}

// 되감기는 timeupdate를 받아서 일어난다. 이벤트를 기다리지 않고 읽으면 "그대로다"가 기다림 없이
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
