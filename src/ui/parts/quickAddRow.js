import { parseQuickAddInput } from '../../core/parse/parseQuickAddInput.js'
import { findTakenTimestamp } from '../../core/tracks/findTakenTimestamp.js'
import { createButton } from '../elements.js'
import { formatTimestamp } from '../../core/time/formatTimestamp.js'
import { createIcon } from '../icons.js'

const PLACEHOLDER = '05:11 곡명 붙여넣기, 또는 제목만'
const EMPTY_HINT = '제목만 쓰면 지금 재생 위치에 들어갑니다. 댓글 여러 줄을 한 번에 붙여넣어도 됩니다.'
const NOTHING_READ = '읽을 수 있는 타임라인이 없습니다'
const MAX_ROWS = 4

// 목록 아래의 한 줄 입력. 대부분은 여기서 Enter로 끝난다.
// 끝 시각이나 미세 조정이 필요할 때만 ⚙로 시트를 연다. 시트에는 입력한 시각과 제목이 채워진다.
export function createQuickAddRow(view) {
  const parts = createParts(view.quickAddText)
  const read = () => readDraft(parts.input.value, view)

  const add = () => {
    const draft = read()

    if (draft.canAdd) {
      view.onQuickAdd(draft.entries)
    }
  }

  // 시트는 트랙 하나만 다룬다. 여러 줄일 때는 버튼이 잠겨 있다.
  const openDetail = () => view.onOpenDetailedAdd(read().entries[0] ?? null)

  parts.detail.addEventListener('click', openDetail)
  parts.submit.addEventListener('click', add)
  parts.input.addEventListener('input', () => {
    view.onQuickTextChange(parts.input.value)
    refresh(parts, read())
  })

  // 한글은 조합을 끝내는 Enter도 keydown으로 들어온다. 그때 넣으면 마지막 글자가 빠진 채 들어간다.
  // 줄바꿈은 Shift+Enter로 남겨 둔다.
  parts.input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault()
      add()
    }
  })

  refresh(parts, read())

  return parts.row
}

function createParts(text) {
  const input = document.createElement('textarea')
  input.className = 'timeline-skip-quick-input'
  input.rows = 1
  input.placeholder = PLACEHOLDER
  input.value = text
  input.setAttribute('aria-label', '트랙 추가')

  const detail = createIconButton('tune', 'timeline-skip-quick-detail', '자세히 추가', '자세히 추가 (끝 시각·미세 조정)')
  const submit = createIconButton('enter', 'timeline-skip-quick-submit', '추가', '추가 (Enter)')

  const box = document.createElement('div')
  box.className = 'timeline-skip-quick'
  box.append(createIcon('add'), input, detail, submit)

  const preview = document.createElement('div')
  preview.className = 'timeline-skip-quick-preview'
  preview.setAttribute('aria-live', 'polite')

  // 시트가 열리면 이 줄은 빠진다. 그 규칙은 이 클래스에 걸려 있다(trackList.css).
  const row = document.createElement('div')
  row.className = 'timeline-skip-add-row'
  row.append(box, preview)

  return { row, input, detail, submit, preview }
}

// 누를 때 할 일은 만든 뒤에 붙인다. 두 버튼 모두 칸의 글을 읽어야 해서 칸이 먼저 있어야 한다.
function createIconButton(iconName, className, ariaLabel, title) {
  const button = createButton({ label: '', className, title, ariaLabel, onClick: () => {} })
  button.append(createIcon(iconName))

  return button
}

// 제목만 쓴 줄의 시각은 읽을 때마다 새로 정한다. 미리보기를 띄운 뒤에도 영상은 흐른다.
function readDraft(text, view) {
  const entries = parseQuickAddInput(text, view.getCurrentTimeSeconds())
  const takenSeconds = findTakenTimestamp(entries, view.tracks)

  return {
    isEmpty: text.trim() === '',
    entries,
    takenSeconds,
    canAdd: entries.length > 0 && takenSeconds === null
  }
}

function refresh(parts, draft) {
  parts.input.rows = Math.min(parts.input.value.split('\n').length, MAX_ROWS)
  parts.submit.disabled = !draft.canAdd
  parts.detail.disabled = draft.entries.length > 1
  parts.preview.replaceChildren(...toPreviewLines(draft))
}

function toPreviewLines(draft) {
  if (draft.isEmpty) {
    return [createText('timeline-skip-quick-hint', EMPTY_HINT)]
  }

  if (draft.entries.length === 0) {
    return [createText('timeline-skip-quick-error', NOTHING_READ)]
  }

  const lines = draft.entries.map((entry) => createPreviewLine(entry, entry.timestampSeconds === draft.takenSeconds))

  if (draft.entries.length > 1) {
    lines.unshift(createText('timeline-skip-quick-hint', `${draft.entries.length}개를 추가합니다`))
  }

  if (draft.takenSeconds !== null) {
    lines.push(createText('timeline-skip-quick-error', `${formatTimestamp(draft.takenSeconds)}에 이미 트랙이 있습니다`))
  }

  return lines
}

function createPreviewLine(entry, isTaken) {
  const line = document.createElement('div')
  line.className = isTaken ? 'timeline-skip-quick-line is-taken' : 'timeline-skip-quick-line'
  line.append(
    createText('timeline-skip-quick-arrow', '→'),
    createText('timeline-skip-quick-time', formatTimestamp(entry.timestampSeconds)),
    createText('timeline-skip-quick-title', entry.title)
  )

  if (entry.usesNow) {
    line.append(createText('timeline-skip-quick-tag', '지금 위치'))
  }

  return line
}

// 붙여넣은 글은 남이 쓴 댓글이다. 항상 textContent로만 넣는다.
function createText(className, text) {
  const element = document.createElement('span')
  element.className = className
  element.textContent = text

  return element
}
