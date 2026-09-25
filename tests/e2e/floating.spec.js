import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡의 제목은 위젯 폭을 확실히 넘긴다. 흐르는 제목과 그렇지 않은 제목이 한 목록에 있어야
// 넘칠 때만 흐른다는 것을 한 번에 볼 수 있다.
const LONG_TITLE = '아주 길어서 위젯의 폭을 훌쩍 넘어가고도 한참 남는 제목을 가진 두 번째 곡'
const TIMELINE_COMMENT = ['00:00 첫 곡', `05:00 ${LONG_TITLE}`, '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const HEADING = `${FLOATING} .timeline-skip-floating-heading`
const CONTROLS = `${FLOATING} .timeline-skip-controls`

test.describe('플로팅 위젯', () => {
  test('전체화면에 들어가면 위젯이 사라지고, 나오면 다시 뜬다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await expect(page.locator(FLOATING)).toBeAttached()

    await enterFullscreen(page)

    await expect(page.locator(FLOATING)).not.toBeAttached()

    await page.evaluate(() => document.exitFullscreen())

    await expect(page.locator(FLOATING)).toBeAttached()
  })

  test('마우스를 올리기만 해서는 펼쳐지지 않는다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await page.locator(ICON).hover()

    await expect(page.locator(ICON)).toBeVisible()
    await expect(page.locator(CARD)).not.toBeAttached()
  })

  test('펼치면 곡 제목과 조작 버튼이 서로 다른 줄에 놓인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    const titleBox = await page.locator(TITLE).boundingBox()
    const controlsBox = await page.locator(CONTROLS).boundingBox()

    expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(controlsBox.y)
  })

  test('제목이 폭을 넘으면 흐르고, 넘지 않으면 흐르지 않는다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await expect(page.locator(TITLE)).not.toHaveClass(/is-scrolling/)

    await seekTo(page, 400)

    await expect(page.locator(TITLE)).toHaveText(LONG_TITLE)
    await expect(page.locator(TITLE)).toHaveClass(/is-scrolling/)
  })

  // 누를 수 있는 범위는 제목 버튼의 크기 그대로다. 폭을 재면 빈 여백이 눌리는지가 드러난다.
  test('짧은 제목은 글자 폭만큼만 차지하고, 긴 제목은 제목 칸 폭을 채운다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    const shortTitleBox = await page.locator(TITLE).boundingBox()
    const headingBox = await page.locator(HEADING).boundingBox()

    expect(shortTitleBox.width).toBeLessThan(headingBox.width / 2)

    await seekTo(page, 400)
    await expect(page.locator(TITLE)).toHaveText(LONG_TITLE)

    const longTitleBox = await page.locator(TITLE).boundingBox()

    expect(Math.abs(longTitleBox.width - headingBox.width)).toBeLessThanOrEqual(1)
  })
})

// requestFullscreen은 사용자 조작이 있어야 불린다. Playwright의 클릭은 진짜 입력이라 그 조건을 채운다.
// 문서 루트에 거는 이유는 그래야 위젯이 전체화면 요소의 자손으로 남기 때문이다. 플레이어에 걸린
// 경우와 달리 브라우저가 대신 감춰주지 않는, 실제로 문제가 되는 쪽이다.
async function enterFullscreen(page) {
  await page.evaluate(() => {
    document.addEventListener('click', () => document.documentElement.requestFullscreen(), { once: true })
  })

  await page.locator('#comments').click()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true)
}

async function loadTimeline(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()
}

// 조작 버튼은 접힘 상태에 아예 없다. 눌러야 하는 검증은 먼저 펼친다.
async function expandWidget(page) {
  await page.locator(ICON).click()
  await expect(page.locator(CARD)).toBeVisible()
}

async function seekTo(page, timestampSeconds) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.evaluate((seconds) => {
    document.querySelector('video').currentTime = seconds
  }, timestampSeconds)
}
