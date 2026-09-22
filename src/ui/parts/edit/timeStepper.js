import { findEndSeekSeconds } from '../../../core/editing/findEndSeekSeconds.js'
import { findNextStartSeconds } from '../../../core/editing/findNextStartSeconds.js'
import { parseTrackInput } from '../../../core/parse/parseTrackInput.js'
import { createButton, createInput } from '../../elements.js'
import { formatTimestamp } from '../../../core/time/formatTimestamp.js'
import { createTimeFieldCard } from './timeFieldCard.js'

const TIME_HINT = '4:29 · 1:02:33 · 429 · 10423 모두 됩니다'

// 시작 칸 하나와 그 옆의 세 버튼. 트랙의 끝은 다음 트랙의 시작이라 적을 칸이 없고,
// 자리를 맞추는 일은 유튜브 플레이어에서 한다. 칸 값은 저장할 때 편집 폼이 읽으므로 함께 돌려준다.
export function createTimeStepper(draft, view) {
  const context = { draft, view, startInput: createStartInput(draft) }

  const fields = document.createElement('div')
  fields.className = 'timeline-skip-time-fields'
  fields.append(createTimeFieldCard('시작', context.startInput, createControls(context)))

  const element = document.createElement('div')
  element.className = 'timeline-skip-stepper'
  element.append(fields)

  return { element, startInput: context.startInput }
}

// [지금]은 칸의 값을 덮어쓰고 나머지 둘은 영상만 옮긴다. 누른 결과의 종류가 다르므로
// 칸막이로 갈라 둔다. ▶는 "여기로 간다"는 뜻을 글자 없이 붙이려는 것이다.
function createControls(context) {
  return [
    createStepButton('지금', '시작을 지금 위치로', '시작을 지금 재생 위치로', () => captureCurrentTime(context)),
    createDivider(),
    createSeekPair(context)
  ]
}

function createSeekPair(context) {
  const pair = document.createElement('div')
  pair.className = 'timeline-skip-seek-pair'
  pair.append(
    createStepButton('▶ 시작', '시작 시각으로 이동', '시작 시각으로 영상을 옮긴다', () =>
      seekTo(context, readStartSeconds(context))
    ),
    createStepButton('▶ 끝', '끝 시각으로 이동', '끝 언저리로 영상을 옮긴다', () =>
      seekTo(context, findEndSeconds(context))
    )
  )

  return pair
}

function createStepButton(label, ariaLabel, title, onClick) {
  return createButton({ label, className: 'timeline-skip-step', title, ariaLabel, onClick })
}

function createDivider() {
  const divider = document.createElement('div')
  divider.className = 'timeline-skip-step-divider'
  divider.setAttribute('aria-hidden', 'true')

  return divider
}

// 찍는 값은 아무 데도 가두지 않는다. 경계를 어디로 옮기든 목록은 시각 순으로 다시 선다.
// 재생 준비 전에는 재생 위치가 NaN이라 칸을 망가뜨리느니 아무것도 하지 않는다.
function captureCurrentTime(context) {
  const currentTimeSeconds = context.view.getCurrentTimeSeconds()

  if (Number.isFinite(currentTimeSeconds)) {
    writeSeconds(context.startInput, Math.floor(currentTimeSeconds))
  }
}

// 끝은 값이 아니라 다음 트랙의 시작이다. 칸의 시작을 고치면 이 자리도 함께 움직인다.
function findEndSeconds(context) {
  return findEndSeekSeconds(readStartSeconds(context), findNextSeconds(context))
}

function seekTo({ view }, targetSeconds) {
  if (targetSeconds !== null && Number.isFinite(targetSeconds)) {
    view.onSeek(targetSeconds)
  }
}

// 영상 길이는 누를 때마다 다시 묻는다. 편집을 연 뒤에야 길이가 정해지기도 한다.
function findNextSeconds({ draft, view, startInput }) {
  const startSeconds = readStartSeconds({ draft, startInput })

  return findNextStartSeconds(view.tracks, draft.previousStartSeconds, startSeconds, view.getDurationSeconds())
}

// 읽을 수 없는 시작은 편집을 연 때의 값으로 본다.
function readStartSeconds({ draft, startInput }) {
  return parseTrackInput(startInput.value, '')?.timestampSeconds ?? draft.startSeconds
}

// 편집 폼은 input 이벤트로 오류 표시를 지운다. 버튼으로 바꾼 값에도 똑같이 반응하게 한다.
function writeSeconds(input, seconds) {
  input.value = formatTimestamp(seconds)
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
