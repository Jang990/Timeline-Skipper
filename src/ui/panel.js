import { SELECTORS } from '../adapters/selectors.js'
import { createEditingState } from './editingState.js'
import { keepListPosition } from './listScroll.js'
import { createListArea } from './parts/listArea.js'
import { createControls } from './parts/playbackControls.js'
import { createHeader } from './parts/panelHeader.js'
import { createRenderGate } from './renderGate.js'

// panelReveal이 같은 패널을 찾아야 한다. 이 id를 아는 곳은 여기 하나로 둔다.
export const PANEL_ID = 'timeline-skip-panel'
const LIST_SELECTOR = '.timeline-skip-list'
const TITLE_INPUT_SELECTOR = '.timeline-skip-title-input'

let lastView = null

const editing = createEditingState()
const gate = createRenderGate()

export function render(view) {
  lastView = view
  const container = document.querySelector(SELECTORS.panelContainer)

  if (container === null) {
    return
  }

  const panel = document.getElementById(PANEL_ID)
  const decision = gate.decide({
    hasPanel: panel !== null,
    view,
    editKey: editing.toKey(),
    isEditing: editing.isEditing()
  })

  if (decision === 'playback') {
    editing.notifyPlayback(view.getCurrentTimeSeconds())
  } else if (decision === 'draw') {
    drawInto(panel ?? createPanel(container), view)
  }
}

// 영상이 바뀌면 편집하던 행은 더 이상 없다. 열려 있던 편집을 닫지 않으면
// 다른 영상의 목록에 그 수정이 적용된다.
export function resetEditing() {
  editing.reset()
  gate.forgetEditKey()
}

// 편집 중에는 건너뛰기와 반복이 재생 위치를 옮기지 않는다. 그 판단에 쓰도록 내보낸다.
export function isEditing() {
  return editing.isEditing()
}

function drawInto(target, view) {
  const previousScrollTop = target.querySelector(LIST_SELECTOR)?.scrollTop ?? 0

  target.replaceChildren(createHeader(view), createControls(view), createListArea(toListView(view)))

  keepListPosition(target.querySelector(LIST_SELECTOR), previousScrollTop)

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
    addingDraftSeconds: editing.getAddingDraftSeconds(),
    watchPlayback: editing.watchPlayback,
    onStartEdit: startEditing,
    onStartAdd: startAdding,
    onCancelEdit: cancelEdit,
    onSubmitEdit: submitEdit,
    onSubmitAdd: submitAdd
  }
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

function createPanel(container) {
  const panel = document.createElement('div')
  panel.id = PANEL_ID
  container.prepend(panel)

  return panel
}
