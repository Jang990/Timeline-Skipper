import { formatTimestamp } from '../formatTimestamp.js'
import { PROGRESS_PLACED_EVENT, createTrackProgressBar } from './trackProgressBar.js'

// 카드와 위젯은 곡 하나를 트는 플레이어로 읽힌다. 영상 전체에서의 시각은 목록에 있으니 여기서는 트랙 안의 시간만 쓴다.
// 흐른 시간, 진행 바, 트랙 길이 순으로 돌려준다. 감쌀 틀은 카드와 위젯이 각자 가진다.
export function createTimedTrackProgress(track, onSeek) {
  const { startSeconds, endSeconds } = track
  const elapsed = createTimeLabel('elapsed', 0)
  const bar = createTrackProgressBar(track, onSeek)

  // 끄는 동안에도 이 신호가 오므로 손이 가리키는 자리의 시간이 적힌다.
  bar.addEventListener(PROGRESS_PLACED_EVENT, (event) => {
    elapsed.textContent = formatTimestamp(event.detail.seconds - startSeconds)
  })

  return [elapsed, bar, createTimeLabel('length', endSeconds - startSeconds)]
}

function createTimeLabel(kind, seconds) {
  const label = document.createElement('span')
  label.className = `timeline-skip-now-playing-${kind}`
  label.textContent = formatTimestamp(seconds)

  return label
}
