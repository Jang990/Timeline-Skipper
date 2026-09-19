import { test, expect } from '../fixtures/extensionContext.js'

// 둘째 곡의 제목은 위젯 폭을 확실히 넘긴다. 흐르는 제목과 그렇지 않은 제목이 한 목록에 있어야
// 넘칠 때만 흐른다는 것을 한 번에 볼 수 있다.
const LONG_TITLE = '아주 길어서 위젯의 폭을 훌쩍 넘어가고도 한참 남는 제목을 가진 두 번째 곡'
const TIMELINE_COMMENT = ['00:00 첫 곡', `05:00 ${LONG_TITLE}`, '10:00 셋째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const ICON = `${FLOATING} .timeline-skip-floating-icon`
const CARD = `${FLOATING} .timeline-skip-floating-card`
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const CONTROLS = `${FLOATING} .timeline-skip-controls`
const COLLAPSE = `${FLOATING} .timeline-skip-floating-collapse`


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

  test('아이콘을 누르면 펼쳐지고, 접기 버튼을 누르면 다시 접힌다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await page.locator(ICON).click()

    await expect(page.locator(CARD)).toBeVisible()
    await expect(page.locator(ICON)).not.toBeAttached()

    await page.locator(COLLAPSE).click()

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

  test('제목을 누르면 패널이 강조된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await page.locator(TITLE).click()

    await expect(page.locator('#timeline-skip-panel')).toHaveClass(/is-revealed/)
  })

  test('펼쳐둔 상태는 새로고침한 뒤에도 유지된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await reloadWatchPage(page)

    await expect(page.locator(CARD)).toBeVisible()
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

// 설정은 저장이 끝나기를 기다려 주지 않는다. 목록이 되살아난 것을 본 다음에 검증해야
// 저장이 늦은 것과 상태가 틀린 것이 구분된다.
async function reloadWatchPage(page) {
  await page.reload()
  await expect(page.locator('.timeline-skip-row').first()).toBeVisible()
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
