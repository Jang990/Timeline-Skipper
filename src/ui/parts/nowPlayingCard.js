import { toBarRatio } from '../../core/editing/toBarRatio.js'
import { formatTimestamp } from '../formatTimestamp.js'
import { createControls } from './playbackControls.js'

// 첫 트랙 앞은 어느 트랙에도 속하지 않는다. 떠 있는 위젯과 같은 말을 쓴다.
const NO_TRACK_LABEL = '트랙 밖 구간'
const PLAYING_LABEL = '지금 재생 중'
const BAR_SELECTOR = '.timeline-skip-now-playing-bar'
const FILL_SELECTOR = '.timeline-skip-now-playing-fill'

// 목록이 길면 재생 중인 행이 스크롤 밖에 있다. 무엇이 나오는지는 목록을 뒤지지 않고 여기서 읽는다.
// 트랙이 없으면 보여줄 제목도 없다. 조작 버튼만 남긴다.
export function createNowPlayingCard(view) {
  const card = document.createElement('div')
  card.className = 'timeline-skip-now-playing'

  if (view.tracks.length > 0) {
    const trackIndex = view.tracks.findIndex((track) => track.startSeconds === view.playingStartSeconds)
    const track = view.tracks[trackIndex]

    card.append(createHeading(trackIndex, track))

    // 끝을 모르는 트랙(진행 중인 라이브)은 비율을 낼 수 없다.
    if (track !== undefined && Number.isFinite(track.endSeconds)) {
      card.append(createProgress(track))
    }
  }

  card.append(createControls(view))
  showNowPlayingProgress(card, view.getCurrentTimeSeconds())

  return card
}

// 패널은 그릴 내용이 같으면 다시 그리지 않는다. 채움 폭만은 재생 위치가 바뀔 때마다 여기서 고친다.
// 범위는 바에 적어 두었다. 그래야 view 전체 없이 재생 위치만으로 고칠 수 있다.
export function showNowPlayingProgress(root, currentTimeSeconds) {
  const bar = root.querySelector(BAR_SELECTOR)

  if (bar === null) {
    return
  }

  const range = { fromSeconds: Number(bar.dataset.fromSeconds), toSeconds: Number(bar.dataset.toSeconds) }
  const ratio = toBarRatio(currentTimeSeconds, range)

  if (ratio !== null) {
    bar.querySelector(FILL_SELECTOR).style.width = `${ratio * 100}%`
  }
}

function createHeading(trackIndex, track) {
  const label = document.createElement('div')
  label.className = 'timeline-skip-now-playing-label'
  label.textContent = track === undefined ? PLAYING_LABEL : `${PLAYING_LABEL} · ${trackIndex + 1}번째 트랙`

  // 댓글 본문은 남이 쓴 문자열이다. 항상 textContent로만 넣는다.
  const title = document.createElement('div')
  title.className = 'timeline-skip-now-playing-title'
  title.textContent = track === undefined ? NO_TRACK_LABEL : track.title
  title.title = title.textContent

  const heading = document.createElement('div')
  heading.className = 'timeline-skip-now-playing-heading'
  heading.append(label, title)

  return heading
}

function createProgress({ startSeconds, endSeconds }) {
  const fill = document.createElement('div')
  fill.className = 'timeline-skip-now-playing-fill'

  const bar = document.createElement('div')
  bar.className = 'timeline-skip-now-playing-bar'
  bar.dataset.fromSeconds = String(startSeconds)
  bar.dataset.toSeconds = String(endSeconds)
  bar.append(fill)

  const progress = document.createElement('div')
  progress.className = 'timeline-skip-now-playing-progress'
  progress.append(createTimeLabel('from', startSeconds), bar, createTimeLabel('to', endSeconds))

  return progress
}

function createTimeLabel(side, seconds) {
  const label = document.createElement('span')
  label.className = `timeline-skip-now-playing-${side}`
  label.textContent = formatTimestamp(seconds)

  return label
}
