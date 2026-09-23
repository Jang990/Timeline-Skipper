import { PLATFORM_PROFILES } from '../../src/adapters/platformProfiles.js'
import { test, expect } from './liveContext.js'

// 픽스처는 지난번에 본 마크업을 재현할 뿐이라, 치지직이 마크업을 바꿔도 픽스처 위 테스트는
// 전부 통과한다. 치지직 클래스는 빌드 해시라 더 잘 바뀐다. 오늘도 유효한지는 이 파일만이 답한다.
//
// 댓글은 남이 언제든 고칠 수 있다. 그래서 트랙 개수나 곡 제목은 단언하지 않는다.
const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const BANNER = '.timeline-skip-load-banner'
const LOAD_BUTTON = '.timeline-skip-load-button'

const { selectors } = PLATFORM_PROFILES.chzzk

test.describe('실제 치지직 다시보기 페이지', () => {
  test('치지직 프로필의 셀렉터가 모두 요소를 찾는다', async ({ openChzzkPage }) => {
    const { page } = await openChzzkPage()
    await scrollToBanner(page)

    for (const [name, selector] of Object.entries(selectors)) {
      // 치지직에 없는 자리는 프로필에서 null이다. 좁은 화면용 칸이 그렇다.
      if (selector === null) {
        continue
      }

      await expect(page.locator(selector).first(), `${name}: ${selector}`).toBeAttached()
    }
  })

  // 접힌 댓글은 뒷부분이 DOM에 없다. 몇 개인지는 댓글에 달렸으므로, 펼치기 전에 보이던 줄보다
  // 늘었는지만 본다. 늘지 않으면 펼치기가 동작하지 않은 것이다.
  test('접힌 댓글에서 불러오면 보이던 것보다 많은 트랙이 목록에 들어간다', async ({ openChzzkPage }) => {
    const { page, readExtensionErrors } = await openChzzkPage()
    await scrollToBanner(page)

    const collapsedBanner = await findCollapsedBanner(page)
    const visibleCount = await countVisibleTimelines(page, collapsedBanner)
    await collapsedBanner.click()

    await expect.poll(() => page.locator(ROW).count(), { timeout: 15_000 }).toBeGreaterThan(visibleCount)
    await expect(page.locator(BANNER).filter({ hasText: '불러왔어요' }).first()).toBeVisible()
    expect(readExtensionErrors()).toEqual([])
  })
})

// 치지직은 댓글을 스크롤에 맞춰 붙인다. 띠가 하나 보일 때까지 내린다.
async function scrollToBanner(page) {
  await expect(page.locator(PANEL)).toBeVisible()

  for (let attempt = 0; attempt < 12; attempt += 1) {
    if ((await page.locator(BANNER).count()) > 0) {
      return
    }

    await page.mouse.wheel(0, 1400)
    await page.waitForTimeout(1000)
  }

  throw new Error('타임라인 댓글을 찾지 못했다. 영상의 댓글이 바뀌었는지 확인해야 한다.')
}

// 더보기가 남아 있는 댓글의 불러오기 버튼을 고른다.
async function findCollapsedBanner(page) {
  const button = await page.evaluateHandle(
    (expandSelector) => {
      const banner = [...document.querySelectorAll('.timeline-skip-load-banner')].find(
        (element) => element.nextElementSibling?.querySelector(expandSelector) !== null
      )

      return banner?.querySelector('.timeline-skip-load-button') ?? null
    },
    selectors.commentExpandButton
  )

  expect(await button.evaluate((element) => element !== null), '접힌 타임라인 댓글이 없다').toBe(true)

  return button.asElement()
}

function countVisibleTimelines(page, bannerButton) {
  return bannerButton.evaluate((button) => {
    const commentText = button.closest('.timeline-skip-load-banner').nextElementSibling.innerText

    return commentText.split('\n').filter((line) => /^\s*\d{1,2}:\d{2}/.test(line)).length
  })
}
