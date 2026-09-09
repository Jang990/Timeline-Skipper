import { parseEndSeconds, parseTrackInput } from '../../core/parse/parseTrackInput.js'
import { isTimestampTaken } from '../../core/tracks/isTimestampTaken.js'
import { createButton, createInput } from '../elements.js'
import { formatTimestamp } from '../formatTimestamp.js'

const INVALID_CLASS = 'is-invalid'
const TIME_HINT = '4:29 · 1:02:33 · 429 · 10423 모두 됩니다'
const END_HINT = '비우면 다음 트랙이 시작할 때까지 재생합니다'
const UNREADABLE_TIME = '시각을 읽을 수 없습니다. 예: 4:29 또는 429'
const END_BEFORE_START = '끝 시각이 시작 시각보다 빠릅니다'

export function createEditRow(draft, { tracks, onSubmitEdit, onCancelEdit }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'timeline-skip-edit'

  const row = document.createElement('div')
  row.className = 'timeline-skip-row is-editing'

  const error = document.createElement('div')
  error.className = 'timeline-skip-error'

  const inputs = [createTimeInput(draft), createEndInput(draft), createTitleInput(draft)]
  const [timeInput, endInput] = inputs

  const submit = () => {
    const result = readEntry(inputs, draft, tracks)

    // 조용히 무시하면 고친 줄 알고 넘어간다. 왜 저장되지 않았는지 그 자리에서 말한다.
    if (result.entry === undefined) {
      showError(error, result)

      return
    }

    onSubmitEdit(draft.previousStartSeconds, result.entry)
  }

  for (const input of [timeInput, endInput]) {
    input.addEventListener('input', () => clearError(error, timeInput, endInput))
  }

  row.addEventListener('keydown', (event) => handleKey(event, submit, onCancelEdit))
  row.append(...inputs, createEditButton('✓', '저장', submit), createEditButton('✕', '취소', onCancelEdit))
  wrapper.append(row, error)

  return wrapper
}

function createTimeInput(draft) {
  const input = createInput({
    className: 'timeline-skip-time-input',
    value: formatTimestamp(draft.startSeconds)
  })
  input.title = TIME_HINT
  input.setAttribute('aria-label', '시작 시각')

  return input
}

// 파생된 끝(다음 트랙까지)은 비워둔 채로 연다. 미리 채우면 제목만 고쳐 저장해도 그때의
// 파생값이 끝으로 굳어, 나중에 이웃 트랙을 옮겼을 때 없던 빈 구간이 생긴다.
function createEndInput(draft) {
  const input = createInput({
    className: 'timeline-skip-end-input',
    value: Number.isFinite(draft.trimmedEndSeconds) ? formatTimestamp(draft.trimmedEndSeconds) : ''
  })
  input.placeholder = '끝 시각'
  input.title = END_HINT
  input.setAttribute('aria-label', '끝 시각')

  return input
}

function createTitleInput(draft) {
  const input = createInput({ className: 'timeline-skip-title-input', value: draft.title })
  input.placeholder = '제목 (비우면 구간만 나눕니다)'
  input.setAttribute('aria-label', '트랙 제목')

  return input
}

// 저장할 항목을 만든다. 막힌 이유가 있으면 어느 칸의 문제인지까지 함께 돌려준다.
function readEntry([timeInput, endInput, titleInput], draft, tracks) {
  const entry = parseTrackInput(timeInput.value, titleInput.value)

  if (entry === null) {
    return { input: timeInput, message: UNREADABLE_TIME }
  }

  if (isTimestampTaken(tracks, entry.timestampSeconds, draft.previousStartSeconds)) {
    return { input: timeInput, message: `${formatTimestamp(entry.timestampSeconds)}에 이미 트랙이 있습니다` }
  }

  const endText = endInput.value.trim()

  // 빈 칸은 "다음 트랙까지"라는 뜻이다. 잘못 적은 것과 갈라야 그 자리에서 이유를 말할 수 있다.
  const endSeconds = endText === '' ? null : parseEndSeconds(endText)

  if (endText !== '' && endSeconds === null) {
    return { input: endInput, message: UNREADABLE_TIME }
  }

  if (endSeconds !== null && endSeconds <= entry.timestampSeconds) {
    return { input: endInput, message: END_BEFORE_START }
  }

  return { entry: { ...entry, endSeconds } }
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

function createEditButton(symbol, label, onClick) {
  return createButton({
    label: symbol,
    className: 'timeline-skip-edit-action',
    title: label,
    ariaLabel: label,
    onClick
  })
}
