import { test, expect } from '../fixtures/extensionContext.js'

// 치지직은 긴 댓글의 뒷부분을 DOM에서 잘라낸다. 접힌 채로 읽으면 앞의 두 개만 들어온다.
const COMMENTS = [
  {
    // 닉네임도 타임라인 모양일 수 있다. 본문만 골라내지 못하면 여기에도 띠가 붙는다.
    nickname: '00:10 낚시꾼',
    lines: ['1:00 첫곡', '2:00 둘째곡', '3:00 셋째곡', '4:00 넷째곡'],
    visibleCount: 2
  }
]

const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const BANNER = '.timeline-skip-load-banner'
const LOAD_BUTTON = '.timeline-skip-load-button'

test.describe('치지직 댓글 불러오기', () => {
  test('접힌 댓글에서 불러오면 더보기 뒤의 타임라인까지 들어온다', async ({ openChzzkPage }) => {
    const { page } = await openChzzkPage({ comments: COMMENTS })

    await page.locator(LOAD_BUTTON).click()

    await expect(page.locator(ROW)).toHaveCount(4)
    await expect(page.locator(`${ROW} .timeline-skip-title`).last()).toHaveText('넷째곡')
  })

  test('불러온 뒤 띠에 실제로 들어간 개수가 보인다', async ({ openChzzkPage }) => {
    const { page } = await openChzzkPage({ comments: COMMENTS })

    await page.locator(LOAD_BUTTON).click()

    await expect(page.locator(BANNER)).toHaveText(/4개를 목록에 불러왔어요/)
  })

  test('댓글 본문이 아닌 곳에는 띠가 붙지 않는다', async ({ openChzzkPage }) => {
    const { page } = await openChzzkPage({ comments: COMMENTS })

    await expect(page.locator(BANNER)).toHaveCount(1)
  })
})
