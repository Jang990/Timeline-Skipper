import { createButton } from '../elements.js'
import { createEqualizerIcon, createIcon } from '../icons.js'
import { createControls } from './playbackControls.js'
import { createTimedTrackProgress } from './timedTrackProgress.js'

// 첫 트랙 앞은 어느 트랙에도 속하지 않는다. 그때도 제목 자리가 비지 않게 채운다.
const NO_TRACK_LABEL = '트랙 밖 구간'
const TITLE_LINK_HINT = ' · 눌러서 목록에서 보기'

// 제목 줄, 진행 바, 버튼 줄로 나눈다. 조작부와 진행 바는 패널이 쓰던 것을 그대로 쓴다.
// playing은 재생 중인 트랙과 그 제목·순번 줄 글자다. 첫 트랙 앞이면 모두 null이다.
// 제목 줄 오른쪽 버튼은 위젯이 탭에 있느냐 PiP 창에 있느냐에 따라 달라서 부르는 쪽이 골라 넘긴다.
export function createCard(view, playing, headingButtons) {
  const card = document.createElement('div')
  card.className = 'timeline-skip-floating-card'

  card.append(
    createTitleLine(playing, headingButtons, view.onRevealPanel),
    ...createProgress(playing.track, view.onSeek),
    createButtonLine(view)
  )

  return card
}

// 끝을 모르는 트랙(진행 중인 라이브)은 비율을 낼 수 없다.
function createProgress(track, onSeek) {
  if (track === null || !Number.isFinite(track.endSeconds)) {
    return []
  }

  const progress = document.createElement('div')
  progress.className = 'timeline-skip-floating-progress'
  progress.append(...createTimedTrackProgress(track, onSeek))

  return [progress]
}

function createTitleLine({ title, meta }, headingButtons, onRevealPanel) {
  const heading = document.createElement('div')
  heading.className = 'timeline-skip-floating-heading'
  heading.append(createTitle(title, onRevealPanel), ...(meta === null ? [] : [createMeta(meta)]))

  const line = document.createElement('div')
  line.className = 'timeline-skip-floating-line'
  line.append(createDragHandle(), heading, ...headingButtons)

  return line
}

// 펼친 위젯은 이 손잡이로만 옮긴다. 평소엔 재생 중 표시로 보이고, 올리면 잡는 점으로 바뀐다.
function createDragHandle() {
  const handle = document.createElement('span')
  handle.className = 'timeline-skip-floating-handle'
  handle.title = '끌어서 옮기기'
  handle.append(createEqualizerIcon(), createIcon('grip'))

  return handle
}

function createMeta(meta) {
  const element = document.createElement('div')
  element.className = 'timeline-skip-floating-meta'
  element.textContent = meta

  return element
}

// 흐름이 꺼진 환경에서는 제목이 잘린 채로 남는다. 잘린 뒷부분은 툴팁으로 읽는다.
// 트랙이 있으면 제목이 목록으로 가는 유일한 입구다. 누를 수 있다는 것은 툴팁 끝의 힌트로 알린다.
// 누르는 자리는 흐르는 글자가 아니라 제목 칸 전체라 글자가 움직여도 짚을 수 있다.
function createTitle(playingTitle, onRevealPanel) {
  const title = playingTitle === null ? document.createElement('div') : createTitleButton(playingTitle, onRevealPanel)
  title.classList.add('timeline-skip-floating-title')

  const text = document.createElement('span')
  text.className = 'timeline-skip-floating-title-text'

  // 댓글 본문은 남이 쓴 문자열이다. 항상 textContent로만 넣는다.
  text.textContent = playingTitle ?? NO_TRACK_LABEL

  title.append(text)
  title.title = playingTitle === null ? NO_TRACK_LABEL : `${playingTitle}${TITLE_LINK_HINT}`

  return title
}

function createTitleButton(playingTitle, onRevealPanel) {
  return createButton({
    label: '',
    className: 'timeline-skip-title-link',
    ariaLabel: `목록에서 보기: ${playingTitle}`,
    onClick: onRevealPanel
  })
}

function createButtonLine(view) {
  const line = document.createElement('div')
  line.className = 'timeline-skip-floating-line'

  line.append(createControls(view))

  return line
}
