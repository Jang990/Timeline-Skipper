import { parseEndSeconds, parseTrackInput } from '../../../core/parse/parseTrackInput.js'
import { isTimestampTaken } from '../../../core/tracks/isTimestampTaken.js'
import { createButton, createInput } from '../../elements.js'
import { formatTimestamp } from '../../formatTimestamp.js'
import { createTimeStepper } from './timeStepper.js'

const INVALID_CLASS = 'is-invalid'
const UNREADABLE_TIME = '시각을 읽을 수 없습니다. 예: 4:29 또는 429'
const END_BEFORE_START = '끝 시각이 시작 시각보다 빠릅니다'

export function createEditRow(draft, view) {
  const { tracks, onSubmitEdit, onCancelEdit } = view
  const wrapper = document.createElement('div')
  wrapper.className = 'timeline-skip-edit'

  const row = document.createElement('div')
  // 트랙 행과 같은 클래스를 쓰지 않는다. 폼은 목록 안에 붙어 열리므로 트랙 행을 세는 곳에 함께 잡힌다.
  row.className = 'timeline-skip-edit-title-row'

  const error = document.createElement('div')
  error.className = 'timeline-skip-error'

  // 시작·끝 칸은 조정 버튼과 한 줄에 산다. 저장할 때 읽어야 해서 칸을 건네받는다.
  const stepper = createTimeStepper(draft, view)
  const { startInput, endInput } = stepper
  const titleInput = createTitleInput(draft)
  const inputs = [startInput, endInput, titleInput]

  const submit = () => {
    const result = readEntry(inputs, draft, tracks)

    // 조용히 무시하면 고친 줄 알고 넘어간다. 왜 저장되지 않았는지 그 자리에서 말한다.
    if (result.entry === undefined) {
      showError(error, result)

      return
    }

    onSubmitEdit(draft.previousStartSeconds, result.entry)
  }

  for (const input of [startInput, endInput]) {
    input.addEventListener('input', () => clearError(error, startInput, endInput))
  }

  // 칸이 여러 줄로 나뉘었다. 어느 줄에 포커스가 있든 Enter와 Esc는 같은 뜻이다.
  wrapper.addEventListener('keydown', (event) => handleKey(event, submit, onCancelEdit))
  row.append(titleInput, createEditButton('✓', '저장', submit), createEditButton('✕', '취소', onCancelEdit))
  wrapper.append(row, stepper.element, error)

  return wrapper
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
