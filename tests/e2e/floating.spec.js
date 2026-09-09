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
const JUMP = `${FLOATING} .timeline-skip-floating-jump`

const HIDE_BUTTON = '#timeline-skip-panel button:has-text("위젯 숨기기")'
const SHOW_BUTTON = '#timeline-skip-panel button:has-text("위젯 보이기")'

test.describe('플로팅 위젯', () => {
  test('트랙이 없으면 위젯이 뜨지 않는다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    await expect(page.locator('#timeline-skip-panel')).toBeVisible()

    await expect(page.locator(FLOATING)).not.toBeAttached()
  })

  test('타임라인을 불러오면 접힌 아이콘이 뜬다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })

    await loadTimeline(page)

    await expect(page.locator(ICON)).toBeVisible()
    await expect(page.locator(CARD)).not.toBeAttached()
  })

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

  test('위젯에 현재 재생 중인 트랙 이름이 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await expect(page.locator(TITLE)).toHaveText('첫 곡')
  })

  test('재생 위치를 옮기면 위젯의 트랙 이름이 그 트랙으로 바뀐다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await seekTo(page, 700)

    await expect(page.locator(TITLE)).toHaveText('셋째 곡')
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

  test('다음 버튼은 다음 트랙 시작으로, 이전 버튼은 이전 트랙 시작으로 옮긴다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await page.locator(`${CARD} [aria-label="다음 트랙"]`).click()

    await expect.poll(() => readCurrentTimeSeconds(page)).toBeGreaterThanOrEqual(300)
    expect(await readCurrentTimeSeconds(page)).toBeLessThan(310)

    await page.locator(`${CARD} [aria-label="이전 트랙"]`).click()

    await expect.poll(() => readCurrentTimeSeconds(page)).toBeLessThan(10)
  })

  test('반복 버튼을 누르면 패널의 반복 버튼도 함께 켜진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await page.locator(`${CARD} [aria-label="반복 켜기"]`).click()

    await expect(page.locator('#timeline-skip-panel .timeline-skip-control.is-active')).toBeVisible()
  })

  test('패널로 이동 버튼을 누르면 패널이 강조된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await page.locator(JUMP).click()

    await expect(page.locator('#timeline-skip-panel')).toHaveClass(/is-revealed/)
  })

  test('패널의 숨기기 버튼을 누르면 위젯이 사라진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)

    await expect(page.locator(FLOATING)).toBeAttached()

    await page.locator(HIDE_BUTTON).click()

    await expect(page.locator(FLOATING)).not.toBeAttached()
  })

  test('숨긴 뒤 보이기 버튼을 누르면 다시 나타난다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await page.locator(HIDE_BUTTON).click()

    await expect(page.locator(FLOATING)).not.toBeAttached()

    await page.locator(SHOW_BUTTON).click()

    await expect(page.locator(ICON)).toBeVisible()
  })

  test('펼쳐둔 위젯을 숨겼다 보이면 펼친 채로 돌아온다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await page.locator(HIDE_BUTTON).click()
    await expect(page.locator(FLOATING)).not.toBeAttached()

    await page.locator(SHOW_BUTTON).click()

    await expect(page.locator(CARD)).toBeVisible()
  })

  test('펼쳐둔 상태는 새로고침한 뒤에도 유지된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await expandWidget(page)

    await reloadWatchPage(page)

    await expect(page.locator(CARD)).toBeVisible()
  })

  test('숨긴 상태는 새로고침한 뒤에도 유지된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await loadTimeline(page)
    await page.locator(HIDE_BUTTON).click()
    await expect(page.locator(FLOATING)).not.toBeAttached()

    await reloadWatchPage(page)

    await expect(page.locator(FLOATING)).not.toBeAttached()
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

function readCurrentTimeSeconds(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}
