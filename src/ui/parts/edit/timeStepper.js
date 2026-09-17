import { findEditRange } from '../../../core/editing/findEditRange.js'
import { nudgeEndSeconds, nudgeStartSeconds } from '../../../core/editing/nudgeTime.js'
import { parseEndSeconds, parseTrackInput } from '../../../core/parse/parseTrackInput.js'
import { createInput } from '../../elements.js'
import { formatTimestamp } from '../../formatTimestamp.js'
import { createPlaybackStepRow } from './playbackStepRow.js'
import { createRangeBar } from './rangeBar.js'
import { createTimeFieldCard } from './timeFieldCard.js'

const TIME_HINT = '4:29 · 1:02:33 · 429 · 10423 모두 됩니다'
const END_HINT = '끝을 비우면 다음 트랙이 시작할 때까지 재생합니다'

// 구간 바, 재생 위치를 옮기는 ± 줄, 시작·끝 칸. 마우스만으로 편집을 끝낼 수 있게 하려는 것이라
// 직접 입력도 그대로 받는다. 칸 값은 저장할 때 편집 폼이 읽으므로 칸도 함께 돌려준다.
export function createTimeStepper(draft, view) {
  const context = { draft, view, startInput: createStartInput(draft), endInput: createEndInput(draft, view) }
  const playbackRow = createPlaybackStepRow(view)

  // 편집 상태는 재생 위치를 한 곳에만 보낸다. 바와 ± 줄이 함께 받도록 여기서 나눠 준다.
  const playbackListeners = [playbackRow.showPosition]
  const sharedView = { ...view, watchPlayback: (listener) => playbackListeners.push(listener) }

  const rangeBar = createRangeBar(draft, sharedView, [context.startInput, context.endInput], () =>
    readShownSeconds(context)
  )

  view.watchPlayback((currentTimeSeconds) => {
    for (const listener of playbackListeners) {
      listener(currentTimeSeconds)
    }
  })

  const element = document.createElement('div')
  element.className = 'timeline-skip-stepper'
  element.append(...(rangeBar === null ? [] : [rangeBar]), playbackRow.element, createTimeFields(context))

  return { element, startInput: context.startInput, endInput: context.endInput }
}

// 빈 끝 칸이 무슨 뜻인지는 칸의 title만으로는 마우스를 올려야 보인다. 칸 아래에 글자로 늘 적어 둔다.
function createTimeFields(context) {
  const fields = document.createElement('div')
  fields.className = 'timeline-skip-time-fields'
  fields.append(
    createTimeFieldCard('시작', context.startInput, () => captureCurrentTime(context, moveStart)),
    createTimeFieldCard('끝', context.endInput, () => captureCurrentTime(context, moveEnd))
  )

  const hint = document.createElement('div')
  hint.className = 'timeline-skip-end-hint'
  hint.textContent = END_HINT

  const fragment = document.createDocumentFragment()
  fragment.append(fields, hint)

  return fragment
}

// 찍는 값은 이웃 경계 안으로 맞춘다. 반대쪽 칸은 사람이 직접 고쳐 둔 값도 이어받는다.
function moveStart(context, fromSeconds) {
  const { startSeconds, endSeconds } = readSeconds(context)
  const range = findRange(context, startSeconds)

  writeSeconds(context.startInput, nudgeStartSeconds(fromSeconds, 0, range, endSeconds))
}

function moveEnd(context, fromSeconds) {
  const { startSeconds } = readSeconds(context)
  const range = findRange(context, startSeconds)

  writeSeconds(context.endInput, nudgeEndSeconds(fromSeconds, 0, range, startSeconds))
}

// 재생 준비 전에는 재생 위치가 NaN이다. 칸을 망가뜨리느니 아무것도 하지 않는다.
function captureCurrentTime(context, move) {
  const currentTimeSeconds = context.view.getCurrentTimeSeconds()

  if (Number.isFinite(currentTimeSeconds)) {
    move(context, currentTimeSeconds)
  }
}

// 빈 끝은 "다음 트랙까지"라는 뜻이다. 바에는 그 뜻대로 다음 트랙이 시작하는 곳까지 칠한다.
function readShownSeconds(context) {
  const { startSeconds, endSeconds } = readSeconds(context)

  return { startSeconds, endSeconds: endSeconds ?? findRange(context, startSeconds).toSeconds }
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
// 대신 그 시각을 안내 글씨로 보여준다. 안내 글씨는 값이 아니라서 저장되지 않는다.
function createEndInput(draft, view) {
  const input = createInput({
    className: 'timeline-skip-end-input',
    value: Number.isFinite(draft.trimmedEndSeconds) ? formatTimestamp(draft.trimmedEndSeconds) : ''
  })
  input.placeholder = toEndHint(findRange({ draft, view }, draft.startSeconds).toSeconds)
  input.title = END_HINT
  input.setAttribute('aria-label', '끝 시각')

  return input
}

// 영상 길이를 모르는 마지막 트랙은 끝나는 시각이 없다. 영상이 끝날 때까지 재생된다.
function toEndHint(toSeconds) {
  return toSeconds === null ? '끝까지' : formatTimestamp(toSeconds)
}
