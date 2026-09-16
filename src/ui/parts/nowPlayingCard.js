import { createControls } from './playbackControls.js'

// 첫 트랙 앞은 어느 트랙에도 속하지 않는다. 떠 있는 위젯과 같은 말을 쓴다.
const NO_TRACK_LABEL = '트랙 밖 구간'
const PLAYING_LABEL = '지금 재생 중'

// 목록이 길면 재생 중인 행이 스크롤 밖에 있다. 무엇이 나오는지는 목록을 뒤지지 않고 여기서 읽는다.
// 트랙이 없으면 보여줄 제목도 없다. 조작 버튼만 남긴다.
export function createNowPlayingCard(view) {
  const card = document.createElement('div')
  card.className = 'timeline-skip-now-playing'

  if (view.tracks.length > 0) {
    card.append(createHeading(view))
  }

  card.append(createControls(view))

  return card
}

function createHeading({ tracks, playingStartSeconds }) {
  const trackIndex = tracks.findIndex((track) => track.startSeconds === playingStartSeconds)

  const label = document.createElement('div')
  label.className = 'timeline-skip-now-playing-label'
  label.textContent = trackIndex === -1 ? PLAYING_LABEL : `${PLAYING_LABEL} · ${trackIndex + 1}번째 트랙`

  // 댓글 본문은 남이 쓴 문자열이다. 항상 textContent로만 넣는다.
  const title = document.createElement('div')
  title.className = 'timeline-skip-now-playing-title'
  title.textContent = trackIndex === -1 ? NO_TRACK_LABEL : tracks[trackIndex].title
  title.title = title.textContent

  const heading = document.createElement('div')
  heading.className = 'timeline-skip-now-playing-heading'
  heading.append(label, title)

  return heading
}
