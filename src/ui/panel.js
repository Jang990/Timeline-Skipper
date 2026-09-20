import { findPanelContainer, isBelowVideo } from '../adapters/panelContainer.js'
import { createEditingHandlers } from './editingHandlers.js'
import { createEditingState } from './editingState.js'
import { keepListPosition, scrollToPlayingRow, scrollToTrackRow } from './listScroll.js'
import { createListArea } from './parts/listArea.js'
import { createNowPlayingCard } from './parts/nowPlayingCard.js'
import { createHeader } from './parts/panelHeader.js'
import { showTrackProgress } from './parts/trackProgressBar.js'
import { createRenderGate } from './renderGate.js'

// panelReveal이 같은 패널을 찾아야 한다. 이 id를 아는 곳은 여기 하나로 둔다.
export const PANEL_ID = 'timeline-skip-panel'
const LIST_SELECTOR = '.timeline-skip-list'
const TITLE_INPUT_SELECTOR = '.timeline-skip-title-input'
const QUICK_INPUT_SELECTOR = '.timeline-skip-quick-input'
const ADD_ROW_SELECTOR = '.timeline-skip-add-row'
const ADD_ROW_HEIGHT_VARIABLE = '--timeline-skip-add-row-height'
const BELOW_VIDEO_CLASS = 'is-below-video'

let lastView = null

// 저장해서 막 들어간 행. 다시 그린 뒤에 한 번 보여주고 지운다.
let arrivingStartSeconds = null

const editing = createEditingState()
const gate = createRenderGate()
const handlers = createEditingHandlers(editing, {
  getView: () => lastView,
  redraw: () => render(lastView),
  markArrival: (startSeconds) => {
    arrivingStartSeconds = startSeconds
  }
})

export function render(view) {
  lastView = view
  const container = findPanelContainer()

  if (container === null) {
    return
  }

  const existingPanel = document.getElementById(PANEL_ID)
  const panel = existingPanel ?? createPanel()
  keepPanelIn(container, panel)

  const decision = gate.decide({
    hasPanel: existingPanel !== null,
    view,
    editKey: editing.toKey(),
    isEditing: editing.isEditing()
  })

  if (decision === 'draw') {
    drawInto(panel, view)

    return
  }

  // 다시 그리지 않을 때도 진행 바는 재생 위치를 따라가야 한다.
  showTrackProgress(panel, view.getCurrentTimeSeconds())

  if (decision === 'playback') {
    editing.notifyPlayback(view.getCurrentTimeSeconds())
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
  const wasTypingQuick = target.querySelector(QUICK_INPUT_SELECTOR) === document.activeElement
  rememberAddRowHeight(target)

  target.replaceChildren(
    createHeader(view),
    createNowPlayingCard({ ...view, onShowPlayingRow: () => scrollToPlayingRow(target) }),
    createListArea(toListView(view))
  )

  keepListPosition(target.querySelector(LIST_SELECTOR), previousScrollTop)

  // 고치려는 사람은 제목부터 손댄다. 바로 덮어쓸 수 있게 골라둔 채로 시작한다.
  if (editing.isEditing()) {
    const titleInput = target.querySelector(TITLE_INPUT_SELECTOR)

    titleInput?.focus()
    titleInput?.select()

    return
  }

  showArrival(target)

  // 재생 중에는 트랙이 바뀔 때마다 다시 그린다. 치던 칸의 초점을 되돌려야 이어서 칠 수 있다.
  if (wasTypingQuick) {
    const quickInput = target.querySelector(QUICK_INPUT_SELECTOR)

    quickInput.focus()
    quickInput.setSelectionRange(quickInput.value.length, quickInput.value.length)
  }
}

// 막 들어간 행으로 목록을 옮긴다. 한 번 보여주고 지워야, 뒤이은 다시 그리기마다 목록이 끌려가지 않는다.
function showArrival(target) {
  if (arrivingStartSeconds === null) {
    return
  }

  scrollToTrackRow(target, arrivingStartSeconds)
  arrivingStartSeconds = null
}

// 시트가 열리면 추가 칸이 빠지고 목록이 그만큼 늘어난다(trackList.css). 칸 높이는 안내 글씨가
// 몇 줄로 접히느냐에 따라 달라서 CSS가 알 수 없다. 칸이 보이는 동안에 재 둔다.
// 시트가 열린 뒤에는 칸이 빠져 0이 나온다. 그 값으로 덮으면 목록이 도로 줄어든다.
function rememberAddRowHeight(target) {
  const height = target.querySelector(ADD_ROW_SELECTOR)?.offsetHeight ?? 0

  if (height > 0) {
    target.style.setProperty(ADD_ROW_HEIGHT_VARIABLE, `${height}px`)
  }
}

function toListView(view) {
  return {
    ...view,
    ...handlers,
    editingStartSeconds: editing.getEditingStartSeconds(),
    addingDraftSeconds: editing.getAddingDraftSeconds(),
    addingDraftTitle: editing.getAddingDraftTitle(),
    quickAddText: editing.getQuickAddText(),
    watchPlayback: editing.watchPlayback
  }
}

// 창 너비가 바뀌면 유튜브가 칸을 바꾼다. 다시 그릴 내용이 없어도 패널은 새 칸으로 가야 한다.
// 칸 안의 순서는 건드리지 않는다. 유튜브 부품과 서로 맨 위를 다투면 DOM 감시가 끝없이 돈다.
function keepPanelIn(container, panel) {
  if (panel.parentElement !== container) {
    container.prepend(panel)
  }

  // 추천 영상 칸은 유튜브가 위를 띄워 두지만, 영상 아래 칸에서는 패널이 영상에 붙어 버린다.
  panel.classList.toggle(BELOW_VIDEO_CLASS, isBelowVideo())
}

function createPanel() {
  const panel = document.createElement('div')
  panel.id = PANEL_ID

  return panel
}
