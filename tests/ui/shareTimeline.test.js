// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from 'vitest'
import { settle, startWithFakes } from '../fixtures/fakes/startWithFakes.js'
import { fillInput, find, findAll, loadTimeline, pressKey, readTexts, toggleTrack } from '../fixtures/fakes/panelHelpers.js'

const TIMELINE_COMMENT = ['00:01 첫 곡', '02:00 둘째 곡', '05:00 셋째 곡'].join('\n')

const MORE_BUTTON = '.timeline-skip-header button[aria-label="더보기"]'
const MENU_ITEM = '.timeline-skip-header [role="menuitem"]'
const SHARE_LABEL = '트랙 복사'
const TOAST = '.timeline-skip-toast'
const INPUT = '.timeline-skip-quick-input'
const ROW_TIME = '.timeline-skip-list .timeline-skip-time'
const ROW_TITLE = '.timeline-skip-list .timeline-skip-title'
const CHECKBOX = '.timeline-skip-list .timeline-skip-row input[type="checkbox"]'

afterEach(() => {
  vi.useRealTimers()
})

describe('트랙 복사', () => {
  it('더보기 메뉴의 "트랙 복사"를 누르면 목록이 [skip]을 포함한 글로 클립보드에 들어간다', async () => {
    const extension = await startWithTimeline()
    toggleTrack(extension, 1)

    await clickShare(extension)

    const lines = extension.clipboard.readText().split('\n')
    expect(lines.slice(0, 3)).toEqual(['00:01 첫 곡', '02:00 [skip] 둘째 곡', '05:00 셋째 곡'])
  })

  it('복사가 끝나면 댓글에 붙여넣으라는 알림이 뜬다', async () => {
    const extension = await startWithTimeline()

    await clickShare(extension)

    expect(document.querySelector(TOAST).textContent).toBe('💬 복사했습니다. 댓글에 붙여넣어 다른 사람과 나눠 보세요')
    expect(document.querySelector(TOAST).getAttribute('role')).toBe('status')
  })

  it('복사에 실패하면 복사했다는 알림 대신 실패 알림이 뜬다', async () => {
    const extension = await startWithTimeline()
    extension.clipboard.writeText = () => Promise.reject(new Error('denied'))

    await clickShare(extension)

    expect(document.querySelector(TOAST).textContent).toBe('복사하지 못했습니다. 다시 눌러 주세요')
  })

  it('알림은 2.5초 뒤 사라진다', async () => {
    const extension = await startWithTimeline()
    vi.useFakeTimers()
    openShareItem(extension).click()
    await vi.advanceTimersByTimeAsync(0)

    await vi.advanceTimersByTimeAsync(2500)

    expect(document.querySelector(TOAST)).toBeNull()
  })

  it('연달아 복사하면 알림은 하나만 남는다', async () => {
    const extension = await startWithTimeline()

    await clickShare(extension)
    await clickShare(extension)

    expect(document.querySelectorAll(TOAST)).toHaveLength(1)
  })

  it('목록이 비어 있으면 메뉴에 "트랙 복사"가 없다', async () => {
    const extension = await startWithFakes()

    find(extension, MORE_BUTTON).click()

    expect(findAll(extension, MENU_ITEM).map((item) => item.textContent)).not.toContain(SHARE_LABEL)
  })

  it('복사한 글을 다른 사람이 빠른 추가 칸에 붙여넣으면 소개 문구는 빠지고 같은 트랙과 체크 상태가 된다', async () => {
    const sharer = await startWithTimeline()
    toggleTrack(sharer, 1)
    await clickShare(sharer)
    const copiedText = sharer.clipboard.readText()

    const receiver = await startWithFakes()
    fillInput(receiver, INPUT, copiedText)
    pressKey(receiver, INPUT, 'Enter')

    expect(readTexts(receiver, ROW_TIME)).toEqual(['00:01', '02:00', '05:00'])
    expect(readTexts(receiver, ROW_TITLE)).toEqual(['첫 곡', '둘째 곡', '셋째 곡'])
    expect(findAll(receiver, CHECKBOX).map((checkbox) => checkbox.checked)).toEqual([true, false, true])
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes()
  loadTimeline(extension, [TIMELINE_COMMENT])

  return extension
}

function openShareItem(extension) {
  find(extension, MORE_BUTTON).click()

  return findAll(extension, MENU_ITEM).find((item) => item.textContent === SHARE_LABEL)
}

async function clickShare(extension) {
  openShareItem(extension).click()
  await settle()
}
