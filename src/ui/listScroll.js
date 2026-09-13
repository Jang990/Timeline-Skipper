const EDIT_TARGET_SELECTOR = '.is-edit-target'
const EDIT_SHEET_SELECTOR = '.timeline-skip-edit-sheet'

// 목록을 통째로 갈아끼우면 스크롤이 맨 위로 돌아간다.
// 아래쪽 트랙을 체크 해제한 사람이 위치를 잃지 않도록 되돌려 놓는다.
export function keepListPosition(list, previousScrollTop) {
  if (list === null) {
    return
  }

  list.scrollTop = previousScrollTop

  // 편집 폼이 목록 아래쪽을 덮는다. 되돌린 위치에서 편집 중인 행이 가려지면 그 행이 보이는 만큼만 옮긴다.
  const row = list.querySelector(EDIT_TARGET_SELECTOR)

  if (row === null) {
    return
  }

  const listBox = list.getBoundingClientRect()
  const visibleBottom = Math.min(listBox.bottom, list.querySelector(EDIT_SHEET_SELECTOR)?.getBoundingClientRect().top ?? Infinity)
  const rowBox = row.getBoundingClientRect()

  if (rowBox.top < listBox.top) {
    list.scrollTop -= listBox.top - rowBox.top
  } else if (rowBox.bottom > visibleBottom) {
    list.scrollTop += rowBox.bottom - visibleBottom
  }
}
