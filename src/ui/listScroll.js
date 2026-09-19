const LIST_SELECTOR = '.timeline-skip-list'
const EDIT_TARGET_SELECTOR = '.is-edit-target'
const EDIT_SHEET_SELECTOR = '.timeline-skip-edit-sheet'
const PLAYING_ROW_SELECTOR = '.timeline-skip-row.is-playing'
const GLIDING_CLASS = 'is-gliding'
const ARRIVED_CLASS = 'is-arrived'
const ARRIVED_MILLISECONDS = 1200

// 연달아 누르면 앞선 타이머가 새 표시를 일찍 끈다. 마지막 것 하나만 남긴다.
let arrivedTimerId = null

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

// 목록 안만 움직인다. scrollIntoView는 바깥 페이지까지 끌고 가서 영상이 화면 밖으로 밀린다.
// 부드럽게 흐르는 것은 이 목록에만 켠다. 늘 켜 두면 다시 그린 뒤 스크롤 위치를 되돌릴 때도 흘러 버린다.
// 도착한 행을 잠깐 반짝여, 목록이 움직이는 동안 놓친 눈이 멈출 자리를 알려준다.
export function scrollToPlayingRow(panel) {
  const list = panel.querySelector(LIST_SELECTOR)
  const row = list?.querySelector(PLAYING_ROW_SELECTOR)

  if (row == null) {
    return
  }

  const rowOffset = row.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop
  list.classList.add(GLIDING_CLASS)
  list.scrollTop = rowOffset - (list.clientHeight - row.offsetHeight) / 2

  // 같은 행을 연달아 누르면 반짝임을 처음부터 다시 보여줘야 눌렸다는 것이 보인다.
  row.classList.remove(ARRIVED_CLASS)
  void row.offsetWidth
  row.classList.add(ARRIVED_CLASS)
  clearTimeout(arrivedTimerId)
  arrivedTimerId = setTimeout(() => row.classList.remove(ARRIVED_CLASS), ARRIVED_MILLISECONDS)
}
