import { parseTrackInput } from '../core/parseTrackInput.js'
import { isTimestampTaken } from '../core/isTimestampTaken.js'
import { formatTimestamp } from './formatTimestamp.js'

const INVALID_CLASS = 'is-invalid'
const TIME_HINT = '4:29 · 1:02:33 · 429 · 10423 모두 됩니다'
const UNREADABLE_TIME = '시각을 읽을 수 없습니다. 예: 4:29 또는 429'

export function createEditRow(draft, { tracks, onSubmitEdit, onCancelEdit }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'timeline-skip-edit'

  const row = document.createElement('div')
  row.className = 'timeline-skip-row is-editing'

  const error = document.createElement('div')
  error.className = 'timeline-skip-error'

  const timeInput = createInput('timeline-skip-time-input', formatTimestamp(draft.startSeconds))
  timeInput.title = TIME_HINT
  timeInput.setAttribute('aria-label', '시작 시각')

  const titleInput = createInput('timeline-skip-title-input', draft.title)
  titleInput.placeholder = '제목 (비우면 구간만 나눕니다)'
  titleInput.setAttribute('aria-label', '트랙 제목')

  const showError = (message) => {
    error.textContent = message
    timeInput.classList.add(INVALID_CLASS)
    timeInput.select()
  }

  const submit = () => {
    const entry = parseTrackInput(timeInput.value, titleInput.value)

    // 조용히 무시하면 고친 줄 알고 넘어간다. 왜 저장되지 않았는지 그 자리에서 말한다.
    if (entry === null) {
      showError(UNREADABLE_TIME)

      return
    }

    if (isTimestampTaken(tracks, entry.timestampSeconds, draft.previousStartSeconds)) {
      showError(`${formatTimestamp(entry.timestampSeconds)}에 이미 트랙이 있습니다`)

      return
    }

    onSubmitEdit(draft.previousStartSeconds, entry)
  }

  timeInput.addEventListener('input', () => clearError(error, timeInput))
  row.addEventListener('keydown', (event) => handleKey(event, submit, onCancelEdit))

  row.append(
    timeInput,
    titleInput,
    createEditButton('✓', '저장', submit),
    createEditButton('✕', '취소', onCancelEdit)
  )
  wrapper.append(row, error)

  return wrapper
}

function clearError(error, timeInput) {
  error.textContent = ''
  timeInput.classList.remove(INVALID_CLASS)
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

function createInput(className, value) {
  const input = document.createElement('input')
  input.type = 'text'
  input.className = className
  input.value = value

  return input
}

function createEditButton(symbol, label, onClick) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'timeline-skip-edit-action'
  button.textContent = symbol
  button.title = label
  button.setAttribute('aria-label', label)
  button.addEventListener('click', onClick)

  return button
}
