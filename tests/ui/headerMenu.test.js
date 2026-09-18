// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes } from '../fixtures/fakes/startWithFakes.js'

// 트랙이 8개인 댓글이다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const ROW = '.timeline-skip-row'
const HEADER = '.timeline-skip-header'
const MORE_BUTTON = `${HEADER} button[aria-label="더보기"]`
const MENU = `${HEADER} [role="menu"]`
const MENU_ITEM = `${MENU} [role="menuitem"]`
const CONFIRM = `${HEADER} [role="alertdialog"]`

describe('헤더 더보기 메뉴', () => {
  it('헤더에 제목과 켠 트랙 수가 따로 보인다', async () => {
    const extension = await startWithTimeline()

    findAll(extension, `${ROW} input[type="checkbox"]`)[2].click()

    expect(find(extension, `${HEADER} .timeline-skip-header-title`).textContent).toBe('타임라인')
    expect(find(extension, `${HEADER} .timeline-skip-header-count`).textContent).toBe('7 / 8')
  })

  it('더보기 메뉴는 처음에 닫혀 있다', async () => {
    const extension = await startWithTimeline()

    expect(find(extension, MORE_BUTTON)).not.toBeNull()
    expect(find(extension, MENU).hidden).toBe(true)
  })

  it('더보기 버튼을 누르면 위젯 숨기기와 목록 비우기가 담긴 메뉴가 열린다', async () => {
    const extension = await startWithTimeline()

    find(extension, MORE_BUTTON).click()

    expect(find(extension, MENU).hidden).toBe(false)
    expect(readMenuLabels(extension)).toEqual(['위젯 숨기기', '목록 비우기'])
  })

  it('더보기 버튼의 aria-expanded가 메뉴가 열렸는지를 따른다', async () => {
    const extension = await startWithTimeline()
    expect(find(extension, MORE_BUTTON).getAttribute('aria-expanded')).toBe('false')

    find(extension, MORE_BUTTON).click()
    expect(find(extension, MORE_BUTTON).getAttribute('aria-expanded')).toBe('true')

    find(extension, MORE_BUTTON).click()
    expect(find(extension, MORE_BUTTON).getAttribute('aria-expanded')).toBe('false')
    expect(find(extension, MENU).hidden).toBe(true)
  })

  it('메뉴에서 목록 비우기를 누르면 목록은 그대로 두고 되돌릴 수 없다는 경고를 띄운다', async () => {
    const extension = await startWithTimeline()

    openClearConfirm(extension)

    expect(findAll(extension, ROW)).toHaveLength(8)
    expect(find(extension, MENU).hidden).toBe(true)
    expect(isConfirmOpen(extension)).toBe(true)
    expect(find(extension, CONFIRM).textContent).toContain('되돌릴 수 없습니다')
    expect(readConfirmButtonLabels(extension)).toEqual(['취소', '비우기'])
  })

  it('경고에서 비우기를 누르면 목록이 비고 경고가 닫힌다', async () => {
    const extension = await startWithTimeline()
    openClearConfirm(extension)

    findConfirmButton(extension, '비우기').click()

    expect(findAll(extension, ROW)).toHaveLength(0)
    expect(isConfirmOpen(extension)).toBe(false)
  })

  it('경고에서 취소를 누르면 목록이 그대로 남고 경고가 닫힌다', async () => {
    const extension = await startWithTimeline()
    openClearConfirm(extension)

    findConfirmButton(extension, '취소').click()

    expect(findAll(extension, ROW)).toHaveLength(8)
    expect(isConfirmOpen(extension)).toBe(false)
  })

  it('경고가 떠 있을 때 Esc를 누르면 목록이 그대로 남고 경고가 닫힌다', async () => {
    const extension = await startWithTimeline()
    openClearConfirm(extension)

    find(extension, CONFIRM).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(findAll(extension, ROW)).toHaveLength(8)
    expect(isConfirmOpen(extension)).toBe(false)
  })

  it('경고를 닫은 뒤 더보기를 다시 누르면 경고가 아니라 메뉴 항목이 보인다', async () => {
    const extension = await startWithTimeline()
    openClearConfirm(extension)
    findConfirmButton(extension, '취소').click()

    find(extension, MORE_BUTTON).click()

    expect(find(extension, MENU).hidden).toBe(false)
    expect(readMenuLabels(extension)).toEqual(['위젯 숨기기', '목록 비우기'])
    expect(isConfirmOpen(extension)).toBe(false)
  })

  it('트랙이 없어도 더보기 메뉴에서 위젯 숨기기를 누를 수 있다', async () => {
    const extension = await startWithFakes()
    find(extension, MORE_BUTTON).click()

    findMenuItem(extension, '위젯 숨기기').click()

    find(extension, MORE_BUTTON).click()
    expect(readMenuLabels(extension)).toContain('위젯 보이기')
  })
})

async function startWithTimeline() {
  const extension = await startWithFakes({ durationSeconds: FIXTURE_VIDEO_SECONDS })
  extension.comments.loadComment(commentTexts.find((text) => extension.comments.countTimelines(text) > 0))

  return extension
}

// 패널은 다시 그릴 때마다 통째로 바뀐다. 요소를 붙들지 말고 매번 새로 찾는다.
function find(extension, selector) {
  return extension.findPanel().querySelector(selector)
}

function findAll(extension, selector) {
  return [...extension.findPanel().querySelectorAll(selector)]
}

function findMenuItem(extension, label) {
  return findAll(extension, MENU_ITEM).find((item) => item.textContent === label)
}

function readMenuLabels(extension) {
  return findAll(extension, MENU_ITEM).map((item) => item.textContent)
}

function openClearConfirm(extension) {
  find(extension, MORE_BUTTON).click()
  findMenuItem(extension, '목록 비우기').click()
}

function isConfirmOpen(extension) {
  const confirm = find(extension, CONFIRM)

  return confirm !== null && !confirm.hidden
}

function findConfirmButton(extension, label) {
  return findAll(extension, `${CONFIRM} button`).find((button) => button.textContent === label)
}

function readConfirmButtonLabels(extension) {
  return findAll(extension, `${CONFIRM} button`).map((button) => button.textContent)
}
