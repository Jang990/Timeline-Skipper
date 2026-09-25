import { test, expect } from '../fixtures/extensionContext.js'

// 댓글 불러오기의 경우들은 jsdom(tests/ui/loadFromComments.test.js)이 맡는다. jsdom에는 innerText가
// 없어 textContent로 대신 읽으므로, 진짜 브라우저의 innerText로 댓글을 읽는지는 여기서만 확인된다.
const TIMELINE_COMMENT = ['00:01 첫 곡', '10:00 셋째 곡'].join('\n')

const LOAD_BANNER = '.timeline-skip-load-banner'
const LOAD_BUTTON = '.timeline-skip-load-button'

test.describe('불러오기 안내 띠', () => {
  test('타임라인 댓글 본문 위에 찾은 개수와 불러오기 버튼이 담긴 띠가 달린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })

    const banner = page.locator(LOAD_BANNER)

    await expect(banner).toContainText('타임라인 2개를 찾았어요')
    await expect(banner.locator(LOAD_BUTTON)).toHaveText('불러오기')
    expect(await banner.evaluate((element) => element.nextElementSibling.id)).toBe('content-text')
  })
})
