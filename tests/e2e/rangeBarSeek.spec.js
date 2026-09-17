import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 바가 덮는 시간은 270~630초이고,
// 칠해진 구간은 300~600초다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-range-bar`
const PLAYHEAD = `${PANEL} .timeline-skip-range-playhead`

// 픽셀로 누르면 자리가 소수로 떨어져 초 단위로 내린 값이 1초 흔들린다.
const CLICK_TOLERANCE_SECONDS = 1

test.describe('구간 바로 이동', () => {
  test('칠해진 구간을 누르면 누른 자리의 시각으로 영상이 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)

    await clickBarAt(page, 0.5)

    await expectSeekedNear(page, 450)
  })

  test('재생 위치 표시 위를 눌러도 그 자리의 시각으로 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)
    await moveVideoTo(page, 400)
    const ratio = await readPlayheadRatio(page)
    await moveVideoTo(page, 100)

    await clickBarAt(page, ratio)

    await expectSeekedNear(page, 400)
  })
})

async function openTimeline(openWatchPage) {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()

  return page
}

// 누르기 전 재생 위치를 바 범위 밖에 둔다. 누른 결과와 원래 자리가 우연히 겹치지 않게 한다.
async function openEditing(openWatchPage) {
  const page = await openTimeline(openWatchPage)
  await pauseAt(page, 100)
  await page.locator(`${PANEL} button[aria-label="둘째 곡 수정"]`).click()
  await expect(page.locator(BAR)).toBeVisible()

  return page
}

async function clickBarAt(page, ratio) {
  const bar = await page.locator(BAR).boundingBox()

  await page.mouse.click(bar.x + bar.width * ratio, bar.y + bar.height / 2)
}

async function expectSeekedNear(page, expectedSeconds) {
  await expect
    .poll(async () => Math.abs((await readCurrentTime(page)) - expectedSeconds))
    .toBeLessThanOrEqual(CLICK_TOLERANCE_SECONDS)
}

// 표시의 가운데가 바의 어디에 있는지를 비율로 읽는다.
async function readPlayheadRatio(page) {
  const bar = await page.locator(BAR).boundingBox()
  const playhead = await page.locator(PLAYHEAD).boundingBox()

  return (playhead.x + playhead.width / 2 - bar.x) / bar.width
}

function readCurrentTime(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}

// 재생 중이면 초가 흘러 옮긴 결과가 흔들린다. 멈춘 채로 옮겨 둔다.
async function pauseAt(page, timestampSeconds) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await moveVideoTo(page, timestampSeconds)
}

async function moveVideoTo(page, timestampSeconds) {
  await page.evaluate((seconds) => {
    const video = document.querySelector('video')
    video.pause()
    video.currentTime = seconds
  }, timestampSeconds)
}
