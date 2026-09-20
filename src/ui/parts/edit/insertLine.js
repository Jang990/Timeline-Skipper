import { findInsertIndex } from '../../../core/editing/findInsertIndex.js'
import { parseTrackInput } from '../../../core/parse/parseTrackInput.js'

const LIST = '.timeline-skip-list'
const ROW = '.timeline-skip-row'
const EDIT_TARGET = '.is-edit-target'
const SHEET = '.timeline-skip-edit-sheet'
const GLIDING_CLASS = 'is-gliding'
const ARRIVED_CLASS = 'is-arrived'
const SETTLE_MILLISECONDS = 350
const ARRIVED_MILLISECONDS = 1200

// 고치는 중인 시각이 목록의 어느 틈으로 들어가는지 선 하나로 알린다. 자리가 그대로일 때도 긋는다.
// 편집 중에는 목록이 다시 그려지지 않아 행이 옛 시각을 달고 있어서, 제자리라는 것도 알려줄 것이다.
//
// 행을 실제로 옮기지는 않는다. 한 글자마다 목록이 다시 서면 무엇을 고치고 있었는지 눈이 놓친다.
export function createInsertLine(wrapper, draft, tracks) {
  const line = createLine()
  const homeIndex = findInsertIndex(tracks, draft.previousStartSeconds, draft.startSeconds)
  const state = { homeIndex, settleTimerId: null, arrivedTimerId: null, anchor: null }

  // 치는 도중에는 움직이지 않는다. "1" "11" "11:4"마다 목록이 흐르면 따라갈 수가 없다.
  const show = (text) => {
    clearTimeout(state.settleTimerId)
    state.settleTimerId = setTimeout(() => settle(wrapper, line, state, readIndex(text, draft, tracks)), SETTLE_MILLISECONDS)
  }

  return { element: line, show }
}

// 읽을 수 없는 시각에는 알릴 자리가 없다.
function readIndex(text, draft, tracks) {
  const parsed = parseTrackInput(text, '')

  return parsed === null ? null : findInsertIndex(tracks, draft.previousStartSeconds, parsed.timestampSeconds)
}

function settle(wrapper, line, state, index) {
  const list = wrapper.closest(LIST)

  if (list === null || index === null) {
    line.remove()
    state.anchor = null

    return
  }

  const anchor = findAnchor(list, index, state.homeIndex)

  list.insertBefore(line, anchor)
  glideTo(list, line)

  // 같은 자리에 머무는 동안 계속 깜빡이면 글자를 칠 수가 없다. 자리가 달라질 때만 알린다.
  if (anchor !== state.anchor) {
    blink(line, state)
    state.anchor = anchor
  }
}

function findAnchor(list, index, homeIndex) {
  const target = list.querySelector(EDIT_TARGET)

  // 자리가 그대로면 고치는 중인 행 바로 위에 긋는다. 그 행이 차지한 틈이 곧 그 자리다.
  if (target !== null && index === homeIndex) {
    return target
  }

  const rows = [...list.querySelectorAll(ROW)].filter((row) => row !== target)

  return rows[index] ?? list.querySelector(SHEET)
}

// 목록 안만 움직인다. scrollIntoView는 바깥 페이지까지 끌고 가서 영상이 화면 밖으로 밀린다.
function glideTo(list, line) {
  const offset = line.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop
  list.classList.add(GLIDING_CLASS)
  list.scrollTop = offset - readVisibleHeight(list) / 2
}

// 시트가 목록 아래쪽을 덮는다. 덮이지 않은 높이 안에 세워야 선이 시트 뒤로 숨지 않는다.
function readVisibleHeight(list) {
  const listBox = list.getBoundingClientRect()
  const sheetTop = list.querySelector(SHEET)?.getBoundingClientRect().top ?? Infinity

  return Math.max(Math.min(listBox.bottom, sheetTop) - listBox.top, 0)
}

// 선이 옮겨 다니는 동안 눈이 놓친다. 멈춘 자리에서 두 번 깜빡여 알린다.
function blink(line, state) {
  line.classList.remove(ARRIVED_CLASS)
  void line.offsetWidth
  line.classList.add(ARRIVED_CLASS)
  clearTimeout(state.arrivedTimerId)
  state.arrivedTimerId = setTimeout(() => line.classList.remove(ARRIVED_CLASS), ARRIVED_MILLISECONDS)
}

function createLine() {
  const line = document.createElement('div')
  line.className = 'timeline-skip-insert-line'
  line.setAttribute('aria-hidden', 'true')

  return line
}
