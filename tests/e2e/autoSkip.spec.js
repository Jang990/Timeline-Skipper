import { test, expect } from '../fixtures/extensionContext.js'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 아래 숫자는 전부 이 목록에서 나온다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const CHECKBOX = 'input[type="checkbox"]'

test.describe('자동 스킵', () => {
  test('체크를 해제한 트랙 안으로 재생 위치를 옮기면 다음 체크된 트랙 시작으로 넘어간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)

    const currentTimeSeconds = await seekAndSettle(page, 300)

    expect(currentTimeSeconds).toBe(556)
  })

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

  // 한 번에 가지 않고 556초를 거쳐 가면 seekAndSettle은 556을 읽는다. 그래서 이 단언이 "한 번에"를 잡는다.
  test('연달아 해제한 트랙 둘은 한 번에 건너뛰어 그다음 체크된 트랙으로 간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await disableTrack(page, 2)

    const currentTimeSeconds = await seekAndSettle(page, 300)

    expect(currentTimeSeconds).toBe(810)
  })

  test('마지막 트랙을 해제하면 그 안으로 옮긴 재생 위치가 영상 끝으로 간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 7)

    const currentTimeSeconds = await seekAndSettle(page, 1797)

    expect(currentTimeSeconds).toBe(FIXTURE_VIDEO_SECONDS)
  })

  test('해제했던 트랙을 다시 체크하면 그 안으로 옮겨도 머문다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await disableTrack(page, 1)
    await enableTrack(page, 1)

    const currentTimeSeconds = await seekAndSettle(page, 300)

    expect(currentTimeSeconds).toBe(300)
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

async function enableTrack(page, trackIndex) {
  const row = page.locator(ROW).nth(trackIndex)

  await row.locator(CHECKBOX).click()
  await expect(row).not.toHaveClass(/is-disabled/)
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

function readCurrentTimeSeconds(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}
