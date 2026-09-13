import { stepPlaybackSeconds } from '../../../core/playback/stepPlaybackSeconds.js'
import { createButton } from '../../elements.js'
import { formatTimestamp } from '../../formatTimestamp.js'

const UNKNOWN_POSITION = '--:--'

// 글자는 짧게, 읽어주는 이름은 뜻으로 쓴다. 영상을 옮기는 버튼이라 플레이어에서 흔히 쓰는 말을 따른다.
const BACKWARD_STEPS = [
  { label: '−10s', deltaSeconds: -10, spokenName: '10초 되감기' },
  { label: '−1s', deltaSeconds: -1, spokenName: '1초 되감기' }
]
const FORWARD_STEPS = [
  { label: '+1s', deltaSeconds: 1, spokenName: '1초 빨리 감기' },
  { label: '+10s', deltaSeconds: 10, spokenName: '10초 빨리 감기' }
]

// ±는 칸이 아니라 영상을 옮긴다. 들어 보며 자리를 맞춘 뒤 [지금으로]로 찍게 하려는 것이다.
// 옮긴 뒤의 글씨는 여기서 고치지 않는다. 영상이 옮겨지면 재생 위치 알림이 다시 온다.
export function createPlaybackStepRow(view) {
  const position = document.createElement('span')
  position.className = 'timeline-skip-playback-position'

  const row = document.createElement('div')
  row.className = 'timeline-skip-playback-row'
  row.append(
    ...BACKWARD_STEPS.map((step) => createStepButton(view, step)),
    position,
    ...FORWARD_STEPS.map((step) => createStepButton(view, step))
  )

  const showPosition = (currentTimeSeconds) => {
    position.textContent = Number.isFinite(currentTimeSeconds) ? formatTimestamp(currentTimeSeconds) : UNKNOWN_POSITION
  }
  showPosition(view.getCurrentTimeSeconds())

  return { element: row, showPosition }
}

function createStepButton(view, { label, deltaSeconds, spokenName }) {
  return createButton({
    label,
    className: 'timeline-skip-step',
    title: spokenName,
    ariaLabel: spokenName,
    onClick: () => seekBy(view, deltaSeconds)
  })
}

function seekBy(view, deltaSeconds) {
  const targetSeconds = stepPlaybackSeconds(view.getCurrentTimeSeconds(), deltaSeconds, view.getDurationSeconds())

  if (targetSeconds !== null) {
    view.onSeek(targetSeconds)
  }
}
