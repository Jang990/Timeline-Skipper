// jsdom 테스트가 패널을 사람처럼 조작하는 손이다. 패널은 다시 그릴 때마다 통째로 바뀌므로
// 요소를 붙들어 두지 말고 매번 이 함수들로 새로 찾는다.

export const ROW = '.timeline-skip-row'

// 진짜 확장에서는 댓글 옆 버튼을 누른다. 타임라인이 담긴 첫 댓글을 고르는 것까지 같게 한다.
export function loadTimeline(extension, commentTexts) {
  extension.comments.loadComment(commentTexts.find((text) => extension.comments.countTimelines(text) > 0))
}

export function find(extension, selector) {
  return extension.findPanel().querySelector(selector)
}

export function findAll(extension, selector) {
  return [...extension.findPanel().querySelectorAll(selector)]
}

export function findRow(extension, trackIndex) {
  return findAll(extension, ROW)[trackIndex]
}

export function clickButton(extension, ariaLabel) {
  find(extension, `button[aria-label="${ariaLabel}"]`).click()
}

export function toggleTrack(extension, trackIndex) {
  findRow(extension, trackIndex).querySelector('input[type="checkbox"]').click()
}

export function openEditRow(extension, title) {
  clickButton(extension, `${title} 수정`)
}

// 사람이 칸에 적으면 값이 바뀌고 input 이벤트가 뒤따른다. 둘 다 흉내 내야 에러 지우기 같은 반응이 돈다.
export function fillInput(extension, selector, value) {
  const input = find(extension, selector)
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

export function pressKey(extension, selector, key) {
  find(extension, selector).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

export function readText(extension, selector) {
  return find(extension, selector)?.textContent ?? null
}

export function readTexts(extension, selector) {
  return findAll(extension, selector).map((element) => element.textContent)
}
