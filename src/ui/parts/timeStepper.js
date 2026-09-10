import { findEditRange } from '../../core/editing/findEditRange.js'
import { nudgeEndSeconds, nudgeStartSeconds } from '../../core/editing/nudgeTime.js'
import { parseEndSeconds, parseTrackInput } from '../../core/parse/parseTrackInput.js'
import { createButton, createInput } from '../elements.js'
import { formatTimestamp } from '../formatTimestamp.js'

const TIME_HINT = '4:29 · 1:02:33 · 429 · 10423 모두 됩니다'
const END_HINT = '비우면 다음 트랙이 시작할 때까지 재생합니다'

// 글자는 짧게, 읽어주는 이름은 뜻으로 쓴다. "앞/뒤"는 시간 방향이 헷갈려 당기기/늦추기로 부른다.
const STEPS = [
  { label: '−1m', deltaSeconds: -60, spokenName: '1분 당기기' },
  { label: '−10s', deltaSeconds: -10, spokenName: '10초 당기기' },
  { label: '−1s', deltaSeconds: -1, spokenName: '1초 당기기' },
  { label: '+1s', deltaSeconds: 1, spokenName: '1초 늦추기' },
  { label: '+10s', deltaSeconds: 10, spokenName: '10초 늦추기' },
  { label: '+1m', deltaSeconds: 60, spokenName: '1분 늦추기' }
]

// 시작·끝 칸과 그 옆의 조정 버튼. 마우스만으로 편집을 끝낼 수 있게 하려는 것이라 직접 입력도 그대로 받는다.
// 칸 값은 저장할 때 편집 폼이 읽으므로 칸도 함께 돌려준다.
export function createTimeStepper(draft, view) {
  const context = { draft, view, startInput: createStartInput(draft), endInput: createEndInput(draft) }

  const element = document.createElement('div')
  element.className = 'timeline-skip-stepper'
  element.append(
    createStepRow('시작', context.startInput, {
      onStep: (deltaSeconds) => moveStart(context, deltaSeconds),
      onCapture: () => captureCurrentTime(context, moveStart)
    }),
    createStepRow('끝', context.endInput, {
      onStep: (deltaSeconds) => moveEnd(context, deltaSeconds),
      onCapture: () => captureCurrentTime(context, moveEnd)
    })
  )

  return { element, startInput: context.startInput, endInput: context.endInput }
}

function createStepRow(fieldName, input, { onStep, onCapture }) {
  const row = document.createElement('div')
  row.className = 'timeline-skip-step-row'

  const label = document.createElement('span')
  label.className = 'timeline-skip-step-label'
  label.textContent = fieldName

  row.append(
    label,
    input,
    ...STEPS.map((step) =>
      createStepButton(step.label, `${fieldName} ${step.spokenName}`, () => onStep(step.deltaSeconds))
    ),
    createStepButton('⏱', `${fieldName}을 지금 위치로`, onCapture)
  )

  return row
}

// 누를 때마다 칸의 지금 값에서 출발한다. 사람이 칸에 직접 고쳐 둔 값도 이어받는다.
function moveStart(context, deltaSeconds, fromSeconds) {
  const { startSeconds, endSeconds } = readSeconds(context)
  const range = findRange(context, startSeconds)

  writeSeconds(context.startInput, nudgeStartSeconds(fromSeconds ?? startSeconds, deltaSeconds, range, endSeconds))
}

function moveEnd(context, deltaSeconds, fromSeconds) {
  const { startSeconds, endSeconds } = readSeconds(context)
  const range = findRange(context, startSeconds)

  writeSeconds(context.endInput, nudgeEndSeconds(fromSeconds ?? endSeconds, deltaSeconds, range, startSeconds))
}

// 재생 준비 전에는 재생 위치가 NaN이다. 칸을 망가뜨리느니 아무것도 하지 않는다.
function captureCurrentTime(context, move) {
  const currentTimeSeconds = context.view.getCurrentTimeSeconds()

  if (Number.isFinite(currentTimeSeconds)) {
    move(context, 0, currentTimeSeconds)
  }
}

// 영상 길이는 누를 때마다 다시 묻는다. 편집을 연 뒤에야 길이가 정해지기도 한다.
function findRange({ draft, view }, startSeconds) {
  return findEditRange(view.tracks, draft.previousStartSeconds, startSeconds, view.getDurationSeconds())
}

// 읽을 수 없는 시작은 편집을 연 때의 값으로 본다. 끝은 비었든 못 읽든 "다음 트랙까지"로 본다.
function readSeconds({ draft, startInput, endInput }) {
  return {
    startSeconds: parseTrackInput(startInput.value, '')?.timestampSeconds ?? draft.startSeconds,
    endSeconds: parseEndSeconds(endInput.value)
  }
}

// 편집 폼은 input 이벤트로 오류 표시를 지운다. 버튼으로 바꾼 값에도 똑같이 반응하게 한다.
function writeSeconds(input, seconds) {
  input.value = seconds === null ? '' : formatTimestamp(seconds)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function createStepButton(label, ariaLabel, onClick) {
  return createButton({ label, className: 'timeline-skip-step', title: ariaLabel, ariaLabel, onClick })
}

function createStartInput(draft) {
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
  input.placeholder = '다음 트랙까지'
  input.title = END_HINT
  input.setAttribute('aria-label', '끝 시각')

  return input
}
