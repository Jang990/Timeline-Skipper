import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다.
// 1100초는 다섯 번째, 1300초는 여섯 번째 트랙 안이고, 0.5초는 첫 트랙 앞이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const CARD = `${PANEL} .timeline-skip-now-playing`
const CARD_LABEL = `${CARD} .timeline-skip-now-playing-label`
const CARD_TITLE = `${CARD} .timeline-skip-now-playing-title`

// 목록이 스크롤될 만큼 긴 댓글. 픽스처 영상(1800초) 안에 들도록 1분 간격으로 29개를 둔다.
// 1210초는 21번째 트랙 안이다.
const LONG_COMMENT = Array.from({ length: 29 }, (_, index) => `${String(index).padStart(2, '0')}:00 트랙 ${index + 1}`).join('\n')

// 픽스처에는 유튜브 스타일이 없다. 어느 테마 값과도 겹치지 않는 색이어야 강조색을 따랐다는 것이 드러난다.
const CALL_TO_ACTION = 'rgb(4, 5, 6)'

test.describe('지금 재생 중 카드', () => {
  test('재생 중인 트랙의 제목과 순번이 카드에 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await seekAndSettle(page, 1100)

    await expect(page.locator(CARD_LABEL)).toContainText('5번째 트랙')
    await expect(page.locator(CARD_TITLE)).toHaveText(await readRowTitle(page, 4))
  })

  test('반복을 켜면 반복 버튼이 강조색으로 그려진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await page.evaluate((color) => {
      document.documentElement.style.setProperty('--yt-sys-color-baseline--call-to-action', color)
    }, CALL_TO_ACTION)

    await page.locator(`${CARD} button[aria-label="반복 켜기"]`).click()

    await expect(page.locator(`${CARD} button[aria-label="반복 끄기"]`)).toHaveCSS('color', CALL_TO_ACTION)
  })

  test('카드 제목을 누르면 목록이 재생 중인 행을 가운데에 두도록 흐르고 페이지는 움직이지 않는다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [LONG_COMMENT] })
    await loadTimeline(page)
    await seekAndSettle(page, 1210)
    await page.locator(CARD_TITLE).scrollIntoViewIfNeeded()
    const pageScrollY = await page.evaluate(() => window.scrollY)

    await page.locator(CARD_TITLE).click()

    await expect(page.locator(`${PANEL} .timeline-skip-list`)).toHaveCSS('scroll-behavior', 'smooth')
    await expect.poll(() => readPlayingRowOffset(page)).toBeLessThanOrEqual(1)
    expect(await page.evaluate(() => window.scrollY)).toBe(pageScrollY)
  })
})

// 재생 중인 행의 세로 가운데가 목록의 세로 가운데에서 몇 px 떨어져 있는지.
function readPlayingRowOffset(page) {
  return page.evaluate((panelSelector) => {
    const list = document.querySelector(`${panelSelector} .timeline-skip-list`)
    const listBox = list.getBoundingClientRect()
    const rowBox = list.querySelector('.timeline-skip-row.is-playing').getBoundingClientRect()

    return Math.abs(rowBox.top + rowBox.height / 2 - (listBox.top + listBox.height / 2))
  }, PANEL)
}

function readRowTitle(page, trackIndex) {
  return page.locator(ROW).nth(trackIndex).locator('.timeline-skip-title').textContent()
}

// 탐색은 영상 길이를 안 뒤에만 먹힌다. 불러오기 전에 그것부터 기다린다.
async function loadTimeline(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}

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
