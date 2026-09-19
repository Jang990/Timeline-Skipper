import { createButton } from '../elements.js'
import { createControls } from './playbackControls.js'
import { createTimedTrackProgress } from './timedTrackProgress.js'
import { showTrackProgress } from './trackProgressBar.js'

// 첫 트랙 앞은 어느 트랙에도 속하지 않는다. 떠 있는 위젯과 같은 말을 쓴다.
const NO_TRACK_LABEL = '트랙 밖 구간'
const PLAYING_LABEL = '지금 재생 중'
const TITLE_LINK_HINT = ' · 눌러서 목록에서 보기'

// 목록이 길면 재생 중인 행이 스크롤 밖에 있다. 무엇이 나오는지는 목록을 뒤지지 않고 여기서 읽는다.
// 트랙이 없으면 보여줄 제목도 없다. 조작 버튼만 남긴다.
export function createNowPlayingCard(view) {
  const card = document.createElement('div')
  card.className = 'timeline-skip-now-playing'

  if (view.tracks.length > 0) {
    const trackIndex = view.tracks.findIndex((track) => track.startSeconds === view.playingStartSeconds)
    const track = view.tracks[trackIndex]

    card.append(createHeading(trackIndex, track, view.onShowPlayingRow))

    // 끝을 모르는 트랙(진행 중인 라이브)은 비율을 낼 수 없다.
    if (track !== undefined && Number.isFinite(track.endSeconds)) {
      card.append(createProgress(track, view.onSeek))
    }
  }

  card.append(createControls(view))
  showTrackProgress(card, view.getCurrentTimeSeconds())

  return card
}

function createHeading(trackIndex, track, onShowPlayingRow) {
  const label = document.createElement('div')
  label.className = 'timeline-skip-now-playing-label'
  label.textContent = track === undefined ? PLAYING_LABEL : `${PLAYING_LABEL} · ${trackIndex + 1}번째 트랙`

  const heading = document.createElement('div')
  heading.className = 'timeline-skip-now-playing-heading'
  heading.append(label, track === undefined ? createPlainTitle() : createTitleButton(track, onShowPlayingRow))

  return heading
}

// 첫 트랙 앞에서는 목록에 데려갈 행이 없다. 누를 수 없는 글자로 둔다.
function createPlainTitle() {
  const title = document.createElement('div')
  title.className = 'timeline-skip-now-playing-title'
  title.textContent = NO_TRACK_LABEL
  title.title = NO_TRACK_LABEL

  return title
}

// 목록이 길면 재생 중인 행은 스크롤 밖에 있다. 제목을 누르면 그 행까지 데려간다.
// 툴팁은 잘린 제목 전체를 읽는 자리라 제목을 먼저 두고, 누를 수 있다는 힌트는 그 뒤에 붙인다.
// 댓글 본문은 남이 쓴 문자열이다. createButton이 textContent로만 넣는다.
function createTitleButton(track, onShowPlayingRow) {
  return createButton({
    label: track.title,
    className: 'timeline-skip-now-playing-title timeline-skip-title-link',
    title: `${track.title}${TITLE_LINK_HINT}`,
    ariaLabel: `목록에서 보기: ${track.title}`,
    onClick: onShowPlayingRow
  })
}

function createProgress(track, onSeek) {
  const progress = document.createElement('div')
  progress.className = 'timeline-skip-now-playing-progress'
  progress.append(...createTimedTrackProgress(track, onSeek))

  return progress
}
