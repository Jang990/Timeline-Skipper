import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡(05:00)을 고친다. 픽스처 영상은 1800초라 바가 덮는 시간은 270~630초이고,
// 칠해진 구간은 300~600초다.
const TIMELINE_COMMENT = ['00:00 첫 곡', '05:00 둘째 곡', '10:00 셋째 곡'].join('\n')

const PANEL = '#timeline-skip-panel'
const BAR = `${PANEL} .timeline-skip-range-bar`
const PLAYHEAD = `${PANEL} .timeline-skip-range-playhead`
const START_INPUT = `${PANEL} .timeline-skip-time-input`
const END_INPUT = `${PANEL} .timeline-skip-end-input`
const TITLE_INPUT = `${PANEL} .timeline-skip-title-input`
const START_MARKER = `${PANEL} button[aria-label="시작 시각으로 이동"]`
const END_MARKER = `${PANEL} button[aria-label="끝 시각으로 이동"]`

// 픽셀로 누르면 자리가 소수로 떨어져 초 단위로 내린 값이 1초 흔들린다.
const CLICK_TOLERANCE_SECONDS = 1

test.describe('구간 바로 이동', () => {
  test('칠해진 구간을 누르면 누른 자리의 시각으로 영상이 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)

    await clickBarAt(page, 0.5)

    await expectSeekedNear(page, 450)
  })

  test('이웃 구간을 눌러도 그 시각으로 영상이 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)

    await clickBarAt(page, 0.03)

    await expectSeekedNear(page, 280.8)
  })

  test('재생 위치 표시 위를 눌러도 그 자리의 시각으로 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)
    await moveVideoTo(page, 400)
    const ratio = await readPlayheadRatio(page)
    await moveVideoTo(page, 100)

    await clickBarAt(page, ratio)

    await expectSeekedNear(page, 400)
  })

  test('바를 누르면 재생 위치 표시가 누른 자리로 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)

    await clickBarAt(page, 0.5)

    await expect.poll(() => readPlayheadRatio(page)).toBeCloseTo(0.5, 1)
  })

  test('시작 표시를 누르면 시작 시각으로 정확히 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)

    await page.locator(START_MARKER).click()

    await expect.poll(() => readCurrentTime(page)).toBe(300)
  })

  test('끝 칸이 비어 있으면 끝 표시는 다음 트랙이 시작하는 시각으로 옮긴다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)

    await page.locator(END_MARKER).click()

    await expect.poll(() => readCurrentTime(page)).toBe(600)
  })

  test('끝 칸에 시각이 있으면 끝 표시는 그 시각으로 정확히 옮긴다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)
    await page.locator(END_INPUT).fill('09:00')

    await page.locator(END_MARKER).click()

    await expect.poll(() => readCurrentTime(page)).toBe(540)
  })

  test('시작 칸을 고치면 시작 표시를 눌렀을 때 고친 시각으로 옮겨진다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)
    await page.locator(START_INPUT).fill('06:00')

    await page.locator(START_MARKER).click()

    await expect.poll(() => readCurrentTime(page)).toBe(360)
  })

  test('바를 눌러도 편집 칸에 입력하던 글자는 그대로다', async ({ openWatchPage }) => {
    const page = await openEditing(openWatchPage)
    await page.locator(TITLE_INPUT).fill('고치던 제목')

    await clickBarAt(page, 0.5)

    await expectSeekedNear(page, 450)
    await expect(page.locator(TITLE_INPUT)).toHaveValue('고치던 제목')
  })

  test('추가 행의 바를 눌러도 영상이 옮겨진다', async ({ openWatchPage }) => {
    const page = await openTimeline(openWatchPage)
    await pauseAt(page, 100)
    await page.locator(`${PANEL} .timeline-skip-add`).click()
    await expect(page.locator(BAR)).toBeVisible()

    // 100초에 추가하면 바는 80~320초를 덮는다.
    await clickBarAt(page, 0.5)

    await expectSeekedNear(page, 200)
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
