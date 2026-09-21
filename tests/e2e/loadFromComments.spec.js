import { test, expect } from '../fixtures/extensionContext.js'

// 합치기는 파서 뒤의 일이라 입력이 실측일 필요가 없다. 필요한 것은 타임라인이 담긴 댓글이
// 둘 이상이고, 뒤 댓글의 시각이 앞 댓글 사이로 끼어드는 배치뿐이다.
const FIRST_COMMENT = ['00:01 첫 곡', '10:00 셋째 곡'].join('\n')
const SECOND_COMMENT = '05:00 둘째 곡'
const PLAIN_COMMENT = '타임라인이 없는 평범한 댓글'
const REPLY_COMMENT = '02:00 대댓글 곡'

const LOAD_BANNER = '.timeline-skip-load-banner'
const LOAD_BUTTON = '.timeline-skip-load-button'
const TITLE = '.timeline-skip-row .timeline-skip-title'
const REPLIES = 'ytd-comment-replies-renderer'
const HEADER = '#timeline-skip-panel .timeline-skip-header'
const CLEAR_ITEM = `${HEADER} [role="menu"] [role="menuitem"]:has-text("목록 비우기")`
const CONFIRM_CLEAR_BUTTON = `${HEADER} [role="alertdialog"] button:text-is("비우기")`

test.describe('불러오기 안내 띠', () => {
  test('타임라인 댓글 본문 위에 찾은 개수와 불러오기 버튼이 담긴 띠가 달린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [FIRST_COMMENT] })

    const banner = page.locator(LOAD_BANNER)

    await expect(banner).toContainText('타임라인 2개를 찾았어요')
    await expect(banner.locator(LOAD_BUTTON)).toHaveText('불러오기')
    expect(await banner.evaluate((element) => element.nextElementSibling.id)).toBe('content-text')
  })

  test('불러오기를 누르면 띠가 불러온 개수를 알리고 버튼이 사라진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [FIRST_COMMENT] })

    await page.locator(LOAD_BUTTON).click()

    await expect(page.locator(LOAD_BANNER)).toHaveText('2개를 목록에 불러왔어요')
    await expect(page.locator(LOAD_BUTTON)).toHaveCount(0)
  })

  test('목록을 비우면 띠가 다시 불러오기 상태로 돌아온다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts: [FIRST_COMMENT] })
    await page.locator(LOAD_BUTTON).click()
    await page.locator(`${HEADER} button[aria-label="더보기"]`).click()
    await page.locator(CLEAR_ITEM).click()

    await page.locator(CONFIRM_CLEAR_BUTTON).click()

    await expect(page.locator(LOAD_BANNER)).toContainText('타임라인 2개를 찾았어요')
    await expect(page.locator(LOAD_BUTTON)).toBeVisible()
  })
})

test.describe('여러 댓글에서 불러오기', () => {
  test('타임라인이 담긴 댓글이 둘이면 불러오기 버튼도 둘 달린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({
      commentTexts: [FIRST_COMMENT, PLAIN_COMMENT, SECOND_COMMENT]
    })

    await expect(page.locator(LOAD_BUTTON)).toHaveCount(2)
  })

  test('두 댓글을 모두 불러오면 시각 순으로 합쳐진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({
      commentTexts: [FIRST_COMMENT, PLAIN_COMMENT, SECOND_COMMENT]
    })

    await page.locator(LOAD_BUTTON).first().click()
    await page.locator(LOAD_BUTTON).last().click()

    await expect(page.locator(TITLE)).toHaveText(['첫 곡', '둘째 곡', '셋째 곡'])
  })
})

test.describe('대댓글에서 불러오기', () => {
  test('대댓글에도 불러오기 버튼이 달린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({
      commentTexts: [{ text: PLAIN_COMMENT, replyTexts: [REPLY_COMMENT] }]
    })

    await expect(page.locator(`${REPLIES} ${LOAD_BUTTON}`)).toBeVisible()
  })

  test('대댓글에서 불러온 타임라인이 목록에 들어간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({
      commentTexts: [{ text: PLAIN_COMMENT, replyTexts: [REPLY_COMMENT] }]
    })

    await page.locator(`${REPLIES} ${LOAD_BUTTON}`).click()

    await expect(page.locator(TITLE)).toHaveText(['대댓글 곡'])
  })

  // 대댓글은 자기 thread 안에 들어 있어서 바깥 thread 셀렉터에도 함께 걸린다.
  // 버튼이 두 번 달리지 않는 것은 querySelectorAll이 같은 요소를 한 번만 돌려주기 때문이다.
  test('대댓글 thread가 중첩돼 있어도 버튼은 하나만 달린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({
      commentTexts: [{ text: FIRST_COMMENT, replyTexts: [REPLY_COMMENT] }]
    })

    await expect(page.locator(`${REPLIES} ${LOAD_BUTTON}`)).toHaveCount(1)
    await expect(page.locator(LOAD_BUTTON)).toHaveCount(2)
  })
})
