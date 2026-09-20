import { parseTrackInput } from '../../../core/parse/parseTrackInput.js'
import { isTimestampTaken } from '../../../core/tracks/isTimestampTaken.js'
import { createInput } from '../../elements.js'
import { formatTimestamp } from '../../formatTimestamp.js'
import { createSheetFooter, createSheetHeader } from './editSheetFrame.js'
import { createInsertLine } from './insertLine.js'
import { createTimeStepper } from './timeStepper.js'

const INVALID_CLASS = 'is-invalid'
const UNREADABLE_TIME = '시각을 읽을 수 없습니다. 예: 4:29 또는 429'

export function createEditRow(draft, view) {
  const { tracks, onSubmitEdit, onCancelEdit } = view
  const wrapper = document.createElement('div')
  wrapper.className = 'timeline-skip-edit'

  const row = document.createElement('div')
  // 트랙 행과 같은 클래스를 쓰지 않는다. 폼은 목록 안에 붙어 열리므로 트랙 행을 세는 곳에 함께 잡힌다.
  row.className = 'timeline-skip-edit-title-row'

  const error = document.createElement('div')
  error.className = 'timeline-skip-error'

  // 시작 칸은 버튼들과 한 줄에 산다. 저장할 때 읽어야 해서 칸을 건네받는다.
  const stepper = createTimeStepper(draft, view)
  const { startInput } = stepper
  const titleInput = createTitleInput(draft)

  const submit = () => {
    const result = readEntry([startInput, titleInput], draft, tracks)

    // 조용히 무시하면 고친 줄 알고 넘어간다. 왜 저장되지 않았는지 그 자리에서 말한다.
    if (result.entry === undefined) {
      showError(error, result)

      return
    }

    onSubmitEdit(draft.previousStartSeconds, result.entry)
  }

  // 고친 시각이 목록의 어느 틈으로 가는지 그 자리에 선을 긋는다. 편집 중에는 목록이 다시 그려지지
  // 않으므로 선이 칸의 글자를 직접 받는다.
  const insertLine = createInsertLine(wrapper, draft, tracks)

  startInput.addEventListener('input', () => {
    clearError(error, startInput)
    insertLine.show(startInput.value)
  })

  // 칸이 여러 줄로 나뉘었다. 어느 줄에 포커스가 있든 Enter와 Esc는 같은 뜻이다.
  wrapper.addEventListener('keydown', (event) => handleKey(event, submit, onCancelEdit))
  row.append(titleInput)
  wrapper.append(
    createSheetHeader(toHeading(draft), onCancelEdit),
    row,
    stepper.element,
    error,
    createSheetFooter(onCancelEdit, submit)
  )

  return wrapper
}

// 새 트랙에는 옮기기 전의 시각이 없다.
function toHeading(draft) {
  return draft.previousStartSeconds === null ? '트랙 추가' : '트랙 수정'
}

function createTitleInput(draft) {
  const input = createInput({ className: 'timeline-skip-title-input', value: draft.title })
  input.placeholder = '제목 (비우면 구간만 나눕니다)'
  input.setAttribute('aria-label', '트랙 제목')

  return input
}

// 저장할 항목을 만든다. 막힌 이유가 있으면 어느 칸의 문제인지까지 함께 돌려준다.
function readEntry([timeInput, titleInput], draft, tracks) {
  const entry = parseTrackInput(timeInput.value, titleInput.value)

  if (entry === null) {
    return { input: timeInput, message: UNREADABLE_TIME }
  }

  if (isTimestampTaken(tracks, entry.timestampSeconds, draft.previousStartSeconds)) {
    return { input: timeInput, message: `${formatTimestamp(entry.timestampSeconds)}에 이미 트랙이 있습니다` }
  }

  return { entry }
}

function showError(error, { input, message }) {
  error.textContent = message
  input.classList.add(INVALID_CLASS)
  input.select()
}

function clearError(error, ...inputs) {
  error.textContent = ''

  for (const input of inputs) {
    input.classList.remove(INVALID_CLASS)
  }
}

// 편집은 몇 초짜리 상호작용이다. 키보드만으로 끝낼 수 있어야 한다.
function handleKey(event, submit, onCancelEdit) {
  if (event.key === 'Enter') {
    event.preventDefault()
    submit()
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    onCancelEdit()
  }
}
