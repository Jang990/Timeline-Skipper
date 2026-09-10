import { test, expect } from '../fixtures/extensionContext.js'

// 합치기는 파서 뒤의 일이라 입력이 실측일 필요가 없다. 필요한 것은 타임라인이 담긴 댓글이
// 둘 이상이고, 뒤 댓글의 시각이 앞 댓글 사이로 끼어드는 배치뿐이다.
const FIRST_COMMENT = ['00:01 첫 곡', '10:00 셋째 곡'].join('\n')
const SECOND_COMMENT = '05:00 둘째 곡'
const PLAIN_COMMENT = '타임라인이 없는 평범한 댓글'
const REPLY_COMMENT = '02:00 대댓글 곡'

const LOAD_BUTTON = '.timeline-skip-load-button'
const TITLE = '.timeline-skip-row .timeline-skip-title'
const REPLIES = 'ytd-comment-replies-renderer'

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
