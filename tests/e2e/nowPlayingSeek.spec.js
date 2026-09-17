import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 다섯 번째 트랙은 1026초(17:06)부터 1253초(20:53)까지 227초다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-now-playing .timeline-skip-now-playing-bar`
const FILL = `${BAR} .timeline-skip-now-playing-fill`
const KNOB = `${BAR} .timeline-skip-now-playing-knob`
const TRACK_START_SECONDS = 1026
const TRACK_LENGTH_SECONDS = 227

// 픽셀로 짚으면 1~2초는 어긋난다.
const SEEK_TOLERANCE_SECONDS = 2
const PIXEL_TOLERANCE = 1.5

test.describe('지금 재생 중 진행 바로 옮기기', () => {
  test('진행 바의 동그라미는 바 밖으로 잘리지 않고 채움 끝에 놓인다', async ({ openWatchPage }) => {
    const page = await openTimelineAt(openWatchPage, TRACK_START_SECONDS + TRACK_LENGTH_SECONDS * 0.5)

    const bar = await page.locator(BAR).boundingBox()
    const fill = await page.locator(FILL).boundingBox()
    const knob = await page.locator(KNOB).boundingBox()
    expect(knob.height).toBeGreaterThan(bar.height)
    expect(Math.abs(knob.x + knob.width / 2 - (fill.x + fill.width))).toBeLessThanOrEqual(PIXEL_TOLERANCE)
    expect(Math.abs(knob.y + knob.height / 2 - (bar.y + bar.height / 2))).toBeLessThanOrEqual(PIXEL_TOLERANCE)
    expect(await page.locator(KNOB).evaluate(isFullyVisible)).toBe(true)
  })

  test('동그라미를 마우스로 끌어 놓으면 놓은 자리의 시각으로 영상이 옮겨진다', async ({ openWatchPage }) => {
    const page = await openTimelineAt(openWatchPage, TRACK_START_SECONDS + TRACK_LENGTH_SECONDS * 0.25)
    const bar = await page.locator(BAR).boundingBox()
    const knob = await page.locator(KNOB).boundingBox()
    const middleY = bar.y + bar.height / 2

    await page.mouse.move(knob.x + knob.width / 2, middleY)
    await page.mouse.down()
    await page.mouse.move(bar.x + bar.width * 0.5, middleY, { steps: 5 })
    await page.mouse.move(bar.x + bar.width * 0.75, middleY, { steps: 5 })
    await page.mouse.up()

    const expectedSeconds = TRACK_START_SECONDS + TRACK_LENGTH_SECONDS * 0.75
    await expect
      .poll(() => page.evaluate(() => document.querySelector('video').currentTime))
      .toBeGreaterThan(expectedSeconds - SEEK_TOLERANCE_SECONDS)
    expect(await page.evaluate(() => document.querySelector('video').currentTime)).toBeLessThan(
      expectedSeconds + SEEK_TOLERANCE_SECONDS
    )
  })
})

// 재생 중이면 초가 흘러 자리가 흔들린다. 멈춘 채로 옮겨 두고 진행 바가 그 자리를 따라올 때까지 기다린다.
async function openTimelineAt(openWatchPage, timestampSeconds) {
  const { page } = await openWatchPage({ commentTexts })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(`${PANEL} .timeline-skip-row`).first()).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.evaluate((seconds) => {
    const video = document.querySelector('video')
    video.pause()
    video.currentTime = seconds
  }, timestampSeconds)
  await expect(page.locator(KNOB)).toBeVisible()
  await page.mouse.move(0, 0)

  return page
}

// 조상 중 하나라도 넘친 부분을 자르면, 동그라미의 네 모서리 중 하나는 다른 요소에 덮여 보인다.
function isFullyVisible(knob) {
  const box = knob.getBoundingClientRect()
  const inset = 1
  const points = [
    [box.left + box.width / 2, box.top + inset],
    [box.left + box.width / 2, box.bottom - inset],
    [box.left + inset, box.top + box.height / 2],
    [box.right - inset, box.top + box.height / 2]
  ]

  return points.every(([x, y]) => {
    const hit = document.elementFromPoint(x, y)

    return hit === knob || knob.contains(hit)
  })
}
