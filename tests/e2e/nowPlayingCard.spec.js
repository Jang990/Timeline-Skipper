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
const CONTROL_NAMES = ['이전 트랙', '다음 트랙']
const FLOATING = '#timeline-skip-floating'

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

  test('재생 위치가 다른 트랙으로 넘어가면 카드의 제목과 순번도 바뀐다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, 1100)

    await seekAndSettle(page, 1300)

    await expect(page.locator(CARD_LABEL)).toContainText('6번째 트랙')
    await expect(page.locator(CARD_TITLE)).toHaveText(await readRowTitle(page, 5))
  })

  test('첫 트랙 앞에서는 카드 제목이 "트랙 밖 구간"이다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await seekAndSettle(page, 0.5)

    await expect(page.locator(CARD_TITLE)).toHaveText('트랙 밖 구간')
  })

  test('트랙이 없으면 카드에 제목 없이 조작 버튼만 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [] })

    await expect(page.locator(CARD)).toBeVisible()

    await expect(page.locator(CARD_TITLE)).toHaveCount(0)
    await expect(page.locator(`${CARD} button`)).toHaveCount(4)
  })

  test('조작 버튼은 글자 없이 아이콘을 그리고 이름은 그대로 읽힌다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })

    await loadTimeline(page)

    const buttons = page.locator(`${CARD} button`)
    await expect(buttons).toHaveCount(4)
    for (const button of await buttons.all()) {
      await expect(button.locator('svg')).toHaveCount(1)
      expect((await button.textContent()).trim()).toBe('')
    }
    for (const name of [...CONTROL_NAMES, '반복 켜기']) {
      await expect(page.locator(`${CARD} button[aria-label="${name}"]`)).toHaveCount(1)
    }
  })

  test('재생 중에는 가운데 버튼이 일시정지 아이콘이고 멈추면 재생 아이콘으로 바뀐다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await page.evaluate(() => document.querySelector('video').play())
    await expect(page.locator(`${CARD} button[aria-label="일시정지"] svg[data-icon="pause"]`)).toHaveCount(1)

    await page.evaluate(() => document.querySelector('video').pause())

    await expect(page.locator(`${CARD} button[aria-label="재생"] svg[data-icon="play"]`)).toHaveCount(1)
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

  test('떠 있는 위젯의 조작 버튼도 아이콘으로 그려진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await page.locator(`${FLOATING} .timeline-skip-floating-icon`).click()

    for (const name of CONTROL_NAMES) {
      const button = page.locator(`${FLOATING} button[aria-label="${name}"]`)
      await expect(button.locator('svg')).toHaveCount(1)
      expect((await button.textContent()).trim()).toBe('')
    }
  })
})

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
