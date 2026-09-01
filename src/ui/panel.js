import { SELECTORS } from '../adapters/selectors.js'
import { createEditingState } from './editingState.js'
import { createList, createAddRow } from './trackList.js'
import { createEditRow } from './trackEditRow.js'
import { createControls } from './playbackControls.js'
import { createHeader } from './panelHeader.js'

const PANEL_ID = 'timeline-skip-panel'
const LIST_SELECTOR = '.timeline-skip-list'
const TITLE_INPUT_SELECTOR = '.timeline-skip-title-input'

// 페이지가 조금만 바뀌어도 다시 그리라는 요청이 온다.
// 내용이 그대로면 건너뛰어야 체크박스가 깜빡이지 않는다.
let lastSignature = null
let lastRenderedEditKey = null
let lastView = null

const editing = createEditingState()

export function render(view) {
  lastView = view
  const container = document.querySelector(SELECTORS.panelContainer)

  if (container === null) {
    return
  }

  const panel = document.getElementById(PANEL_ID)

  // 편집 중에 다시 그리면 입력하던 글자가 사라진다. 편집 대상이 바뀔 때만 그린다.
  if (panel !== null && editing.isEditing() && editing.toKey() === lastRenderedEditKey) {
    return
  }

  const signature = `${toSignature(view)}#${editing.toKey()}`

  if (panel !== null && signature === lastSignature) {
    return
  }

  lastSignature = signature
  lastRenderedEditKey = editing.toKey()
  drawInto(panel ?? createPanel(container), view)
}

// 영상이 바뀌면 편집하던 행은 더 이상 없다. 열려 있던 편집을 닫지 않으면
// 다른 영상의 목록에 그 수정이 적용된다.
export function resetEditing() {
  editing.reset()
  lastRenderedEditKey = null
}

function drawInto(target, view) {
  // 목록을 통째로 갈아끼우면 스크롤이 맨 위로 돌아간다.
  // 아래쪽 트랙을 체크 해제한 사람이 위치를 잃지 않도록 되돌려 놓는다.
  const previousScrollTop = target.querySelector(LIST_SELECTOR)?.scrollTop ?? 0

  target.replaceChildren(
    createHeader(view),
    createControls(view),
    view.tracks.length === 0 ? createEmptyMessage() : createList(toListView(view)),
    createAddArea(view)
  )

  const nextList = target.querySelector(LIST_SELECTOR)

  if (nextList !== null) {
    nextList.scrollTop = previousScrollTop
  }

  // 고치려는 사람은 제목부터 손댄다. 바로 덮어쓸 수 있게 골라둔 채로 시작한다.
  if (editing.isEditing()) {
    const titleInput = target.querySelector(TITLE_INPUT_SELECTOR)

    titleInput?.focus()
    titleInput?.select()
  }
}

function toListView(view) {
  return {
    ...view,
    editingStartSeconds: editing.getEditingStartSeconds(),
    onStartEdit: startEditing,
    onCancelEdit: cancelEdit,
    onSubmitEdit: submitEdit
  }
}

// 추가하는 동안에는 "+ 직접 추가" 자리가 그대로 입력 폼이 된다.
function createAddArea(view) {
  const addingDraftSeconds = editing.getAddingDraftSeconds()

  if (addingDraftSeconds === null) {
    return createAddRow(startAdding)
  }

  return createEditRow(
    { startSeconds: addingDraftSeconds, title: '', previousStartSeconds: null },
    { tracks: view.tracks, onSubmitEdit: (previousStartSeconds, entry) => submitAdd(entry), onCancelEdit: cancelEdit }
  )
}

// 아래 다섯은 상태를 바꾸고 다시 그리기만 한다. 무엇이 열리고 닫히는지는 editingState가 안다.
function startEditing(startSeconds) {
  editing.startEditing(startSeconds)
  render(lastView)
}

// 듣다가 "여기부터 새 곡"이 되는 흐름이라 지금 재생 위치를 기본값으로 넣는다.
function startAdding() {
  editing.startAdding(lastView.getCurrentTimeSeconds())
  render(lastView)
}

// 편집이든 추가든 취소는 하나다. 열려 있던 입력을 닫고 원래 목록으로 돌아간다.
function cancelEdit() {
  editing.cancel()
  render(lastView)
}

// 편집을 먼저 닫아야 이어지는 그리기가 억제되지 않는다.
function submitEdit(previousStartSeconds, entry) {
  editing.finishEdit()
  lastView.onEdit(previousStartSeconds, entry)
}

function submitAdd(entry) {
  editing.finishAdd()
  lastView.onAdd(entry)
}

function toSignature({ tracks, disabledStartSeconds, isPaused, loopEnabled }) {
  const trackPart = tracks.map((track) => `${track.startSeconds}:${track.title}`).join('|')

  return `${trackPart}#${[...disabledStartSeconds].join(',')}#${isPaused}#${loopEnabled}`
}

function createPanel(container) {
  const panel = document.createElement('div')
  panel.id = PANEL_ID
  container.prepend(panel)

  return panel
}

function createEmptyMessage() {
  const message = document.createElement('div')
  message.className = 'timeline-skip-empty'
  message.textContent = '아래 댓글에서 "타임라인 불러오기" 버튼을 누르면 목록이 만들어집니다. 여러 댓글을 눌러 합칠 수 있습니다.'

  return message
}
