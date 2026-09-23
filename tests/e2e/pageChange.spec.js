import { test, expect } from '../fixtures/extensionContext.js'

const TIMELINE_COMMENT = ['00:01 첫 곡', '00:05 둘째 곡'].join('\n')
const OTHER_VIDEO_PATH = '/watch?v=otherVideo'

const LOAD_BUTTON = '.timeline-skip-load-button'
const TITLE = '.timeline-skip-row .timeline-skip-title'

// 유튜브는 영상을 옮긴 뒤 추천 목록과 댓글을 몇 초 동안 계속 붙인다.
// 확장이 페이지가 잠잠해지길 기다리는 간격보다 짧게 DOM을 바꿔 그 상황을 만든다.
const BUSY_MUTATION_MILLISECONDS = 100
const SWITCH_DEADLINE_MILLISECONDS = 1000

test('다른 영상으로 옮기면 DOM이 계속 바뀌는 중에도 목록이 곧바로 그 영상의 것으로 바뀐다', async ({ openWatchPage }) => {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
  await page.locator(LOAD_BUTTON).click()
  await expect(page.locator(TITLE)).toHaveText(['첫 곡', '둘째 곡'])

  await page.evaluate(({ path, intervalMilliseconds }) => {
    history.pushState({}, '', path)
    setInterval(() => document.body.append(document.createElement('div')), intervalMilliseconds)
  }, { path: OTHER_VIDEO_PATH, intervalMilliseconds: BUSY_MUTATION_MILLISECONDS })

  await expect(page.locator(TITLE)).toHaveCount(0, { timeout: SWITCH_DEADLINE_MILLISECONDS })
})

// 치지직 다시보기는 채팅이 같은 문서에 계속 붙어서 페이지가 잠잠해지는 순간이 오지 않는다.
test('DOM이 계속 바뀌는 중에 붙은 타임라인 댓글에도 불러오기 버튼이 곧바로 붙는다', async ({ openWatchPage }) => {
  const { page } = await openWatchPage()

  await page.evaluate((intervalMilliseconds) => {
    setInterval(() => document.body.append(document.createElement('div')), intervalMilliseconds)
  }, BUSY_MUTATION_MILLISECONDS)
  await page.waitForTimeout(SWITCH_DEADLINE_MILLISECONDS)

  await page.evaluate((commentText) => {
    const thread = document.createElement('ytd-comment-thread-renderer')
    const text = document.createElement('yt-attributed-string')
    text.id = 'content-text'
    text.textContent = commentText
    thread.append(text)
    document.body.append(thread)
  }, TIMELINE_COMMENT)

  await expect(page.locator(LOAD_BUTTON)).toBeVisible({ timeout: SWITCH_DEADLINE_MILLISECONDS * 2 })
})
