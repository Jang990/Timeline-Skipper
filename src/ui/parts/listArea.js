import { createEditRow } from './edit/trackEditRow.js'
import { createQuickAddRow } from './quickAddRow.js'
import { createList } from './trackList.js'

const EMPTY_MESSAGE = '아래 댓글에서 "타임라인 불러오기" 버튼을 누르면 목록이 만들어집니다. 여러 댓글을 눌러 합칠 수 있습니다.'

// 목록과 그 아래 한 줄 추가 칸. 편집 폼은 목록 아래쪽에서 올라와 목록을 덮는다.
// 폼을 목록 맨 끝에 붙이고 바닥에 달라붙게 하면, 목록이 길 때는 높이를 그대로 둔 채 덮고
// 짧을 때는 행 아래에 놓인다. 폼도 목록 안에서 자리를 차지하므로 끝까지 내리면 모든 행이 폼 위로 보인다.
export function createListArea(view) {
  const sheet = createEditSheet(view)
  const area = document.createElement('div')
  area.className = 'timeline-skip-list-area'
  area.classList.toggle('is-editing', sheet !== null)

  // 추가 칸은 시트가 열려도 DOM에 둔다. 빼는 일은 CSS가 한다(trackList.css). 치던 글자가 칸에 남아 있어야 한다.
  area.append(createContent(view, sheet), createQuickAddRow(view))

  return area
}

// 트랙이 없으면 스크롤할 목록도 없다. 안내 문구 아래에 폼을 그냥 잇는다.
function createContent(view, sheet) {
  const content = view.tracks.length === 0 ? createEmptyMessage() : createList(view)

  if (sheet === null) {
    return content
  }

  if (view.tracks.length === 0) {
    const wrapper = document.createElement('div')
    wrapper.append(content, sheet)

    return wrapper
  }

  content.append(sheet)

  return content
}

function createEditSheet(view) {
  const form = createForm(view)

  if (form === null) {
    return null
  }

  const sheet = document.createElement('div')
  sheet.className = 'timeline-skip-edit-sheet'
  sheet.append(form)

  return sheet
}

function createForm(view) {
  const editingTrack = view.tracks.find((track) => track.startSeconds === view.editingStartSeconds)

  if (editingTrack !== undefined) {
    return createEditRow({ ...editingTrack, previousStartSeconds: editingTrack.startSeconds }, view)
  }

  if (view.addingDraftSeconds !== null) {
    return createEditRow(
      { startSeconds: view.addingDraftSeconds, title: view.addingDraftTitle, previousStartSeconds: null },
      { ...view, onSubmitEdit: (previousStartSeconds, entry) => view.onSubmitAdd(entry) }
    )
  }

  return null
}

function createEmptyMessage() {
  const message = document.createElement('div')
  message.className = 'timeline-skip-empty'
  message.textContent = EMPTY_MESSAGE

  return message
}
