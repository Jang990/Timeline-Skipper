import { test, expect } from '../fixtures/extensionContext.js'

// 처음 열리는 작은 창에서는 잘리고, 키운 창에서는 다 들어가는 길이다.
const TITLE_TEXT = '탭에는 들어가는 제목 하나'
const TIMELINE_COMMENT = [`00:00 ${TITLE_TEXT}`, '05:00 둘째 곡'].join('\n')

const FLOATING = '#timeline-skip-floating'
const TITLE = `${FLOATING} .timeline-skip-floating-title`

const SMALL_WINDOW = { width: 300, height: 64 }
const LARGE_WINDOW = { width: 500, height: 300 }

// 창 크기가 바뀌어도 위젯은 다시 그려지지 않는다. 흐를지는 그리지 않고도 따라가야 한다.
// 같은 판단의 여러 경우는 탭의 위젯에서 floating.spec.js가 본다.
test.describe('PiP 창 크기에 따라 흐르는 제목', () => {
  // 고정 viewport를 두면 PiP 창도 그 크기로 늘어난다.
  test.use({ viewport: null })

  test('PiP 창을 키워 제목이 다 들어가면 멈추고, 다시 줄여 잘리면 흐른다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
    await openPictureInPicture(page)
    await expect.poll(() => readTitleInWindow(page)).toEqual({ fits: false, scrolling: true })

    await resizeWindow(page, LARGE_WINDOW)

    await expect.poll(() => readTitleInWindow(page)).toEqual({ fits: true, scrolling: false })

    await resizeWindow(page, SMALL_WINDOW)

    await expect.poll(() => readTitleInWindow(page)).toEqual({ fits: false, scrolling: true })
  })
})

async function openPictureInPicture(page) {
  await page.locator('.timeline-skip-load-button').first().click()
  await page.locator(`${FLOATING} .timeline-skip-floating-icon`).click()
  await page.locator(`${FLOATING} button[aria-label="PiP로 띄우기"]`).click()
  await expect.poll(() => page.evaluate(() => window.documentPictureInPicture.window !== null)).toBe(true)
}

// PiP 창은 Playwright의 page로 잡히지 않는다. 탭 문서에서 창을 거쳐 들여다본다.
function readTitleInWindow(page) {
  return page.evaluate((titleSelector) => {
    const title = window.documentPictureInPicture.window?.document.querySelector(titleSelector)

    if (title == null) {
      return null
    }

    const textWidth = title.querySelector('.timeline-skip-floating-title-text').scrollWidth

    return { fits: textWidth <= title.clientWidth, scrolling: title.classList.contains('is-scrolling') }
  }, TITLE)
}

// 크롬은 사람의 손길 안에서만 PiP 창의 크기를 바꿔 준다. Playwright는 PiP 창을 누를 수 없어서
// 탭에 버튼을 붙여 누른다.
async function resizeWindow(page, { width, height }) {
  const widthBefore = await page.evaluate(() => window.documentPictureInPicture.window.innerWidth)

  await page.evaluate(([outerWidth, outerHeight]) => {
    document.getElementById('resize-picture-in-picture')?.remove()

    const button = document.createElement('button')
    button.id = 'resize-picture-in-picture'
    button.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 99999'
    button.textContent = '창 크기 바꾸기'
    button.addEventListener('click', () => window.documentPictureInPicture.window.resizeTo(outerWidth, outerHeight))
    document.body.append(button)
  }, [width, height])

  await page.locator('#resize-picture-in-picture').click()
  await expect.poll(() => page.evaluate(() => window.documentPictureInPicture.window.innerWidth)).not.toBe(widthBefore)
}
