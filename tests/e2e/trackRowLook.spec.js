import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초다. 1100초는 다섯 번째 트랙 안이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const CHECKBOX = 'input[type="checkbox"]'
const EQUALIZER = '.timeline-skip-equalizer'
const EDIT_BUTTON = 'button[aria-label$=" 수정"]'
const REMOVE_BUTTON = 'button[aria-label$=" 목록에서 빼기"]'
const PLAYING_SECONDS = 1100
const PLAYING_INDEX = 4

test.describe('트랙 목록 행의 모양', () => {
  test('재생 중인 행에만 막대 그림이 보인다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await seekAndSettle(page, PLAYING_SECONDS)

    await expect(page.locator(ROW).nth(PLAYING_INDEX).locator(EQUALIZER)).toBeVisible()
    await expect(page.locator(`${ROW} ${EQUALIZER}`)).toHaveCount(1)
  })

  test('체크한 체크박스와 해제한 체크박스는 배경색이 다르다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)

    await toggleTrack(page, 2)

    const checkedColor = await readBackgroundColor(page.locator(ROW).nth(1).locator(CHECKBOX))
    const uncheckedColor = await readBackgroundColor(page.locator(ROW).nth(2).locator(CHECKBOX))
    expect(checkedColor).not.toBe(uncheckedColor)
  })

  test('행에 마우스를 올리면 행 배경이 바뀌고 수정 버튼이 드러난다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await seekAndSettle(page, PLAYING_SECONDS)
    const row = page.locator(ROW).nth(1)
    const restingColor = await readBackgroundColor(row)

    await row.hover()

    await expect.poll(() => readBackgroundColor(row)).not.toBe(restingColor)
    await expect(row.locator(EDIT_BUTTON)).toHaveCSS('opacity', '1')
  })

  test('빼기 버튼에 마우스를 올리면 그 행만 밝아지고 앞 행은 그대로다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    const previousRow = page.locator(ROW).nth(2)
    const row = page.locator(ROW).nth(3)
    const restingColor = await readBackgroundColor(previousRow)

    await row.hover()
    await row.locator(REMOVE_BUTTON).hover()

    await expect.poll(() => readBackgroundColor(row)).not.toBe(restingColor)
    expect(await readBackgroundColor(previousRow)).toBe(restingColor)
  })
})

// 탐색은 영상 길이를 안 뒤에만 먹힌다. 불러오기 전에 그것부터 기다린다.
async function loadTimeline(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()

  // 픽스처에서는 불러오기 버튼과 목록이 같은 높이에 있다. 마우스가 행 위에 남으면 hover가 상태 표시를 치운다.
  await page.mouse.move(0, 0)
}

// 체크를 바꾸면 목록이 다시 그려진다. 다시 그려진 행에서 상태를 확인한 뒤 넘어간다.
async function toggleTrack(page, trackIndex) {
  const checkbox = page.locator(ROW).nth(trackIndex).locator(CHECKBOX)
  const wasChecked = await checkbox.isChecked()

  await checkbox.click()
  await expect(page.locator(ROW).nth(trackIndex).locator(CHECKBOX)).toBeChecked({ checked: !wasChecked })
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

function readBackgroundColor(locator) {
  return locator.evaluate((element) => getComputedStyle(element).backgroundColor)
}
