import { SELECTORS } from '../../src/adapters/selectors.js'
import { test, expect } from './liveContext.js'

// 픽스처는 지난번에 본 마크업을 재현할 뿐이라, 유튜브가 마크업을 바꿔도 픽스처 위 테스트는
// 전부 통과한다. selectors.js가 오늘도 유효한지는 이 파일만이 답한다.
//
// 댓글은 남이 언제든 고칠 수 있다. 그래서 트랙 개수나 곡 제목은 단언하지 않는다.
// 이 파일이 답해야 하는 질문은 "유튜브가 그 모양 그대로인가"지 "댓글이 그대로인가"가 아니다.
const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const LOAD_BUTTON = '.timeline-skip-load-button'

test.describe('실제 유튜브 시청 페이지', () => {
  test('selectors.js의 셀렉터가 모두 요소를 찾는다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage()

    for (const [name, selector] of Object.entries(SELECTORS)) {
      await expect(page.locator(selector).first(), `${name}: ${selector}`).toBeAttached()
    }
  })

  test('패널이 추천 영상 칸 안에 그려진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage()

    await expect(page.locator(`${SELECTORS.panelContainer} > ${PANEL}`)).toBeVisible()
  })

  test('타임라인 댓글에 불러오기 버튼이 달린다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage()

    await expect(page.locator(LOAD_BUTTON).first()).toBeVisible()
  })

  test('불러오기 버튼을 누르면 트랙 목록이 만들어진다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage()

    await loadTimeline(page)

    await expect(page.locator(`${ROW} .timeline-skip-time`).first()).toHaveText(/^\d{1,2}:\d{2}/)
  })

  test('확장이 낸 콘솔 오류가 없다', async ({ openWatchPage }) => {
    const { page, readExtensionErrors } = await openWatchPage()

    await loadTimeline(page)

    expect(readExtensionErrors()).toEqual([])
  })
})

async function loadTimeline(page) {
  await page.locator(LOAD_BUTTON).first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}
