import { createEqualizerIcon } from '../icons.js'
import { createJumpButton } from './floatingButtons.js'
import { createControls } from './playbackControls.js'
import { createTrackProgressBar } from './trackProgressBar.js'

// 첫 트랙 앞은 어느 트랙에도 속하지 않는다. 그때도 제목 자리가 비지 않게 채운다.
const NO_TRACK_LABEL = '트랙 밖 구간'

const TITLE_SELECTOR = '.timeline-skip-floating-title'
const TITLE_TEXT_SELECTOR = '.timeline-skip-floating-title-text'

// 흐르는 속도를 고정한다. 제목이 길수록 오래 걸려야 읽는 속도가 제목마다 달라지지 않는다.
const MARQUEE_PIXELS_PER_SECOND = 24
const MARQUEE_MINIMUM_SECONDS = 5

// 한 바퀴에서 글자가 실제로 흐르는 구간의 비율. floating.css의 키프레임(8% → 78%)과 짝이다.
// 나머지는 양 끝에서 멈춰 있는 시간과 처음으로 돌아오는 시간이라 속도 계산에서 빼야 한다.
const MARQUEE_SCROLL_RATIO = 0.7

// 제목 줄, 진행 바, 버튼 줄로 나눈다. 조작부와 진행 바는 패널이 쓰던 것을 그대로 쓴다.
// playing은 재생 중인 트랙과 그 제목·순번 줄 글자다. 첫 트랙 앞이면 모두 null이다.
// 제목 줄 오른쪽 버튼은 위젯이 탭에 있느냐 PiP 창에 있느냐에 따라 달라서 부르는 쪽이 골라 넘긴다.
export function createCard(view, playing, headingButtons) {
  const card = document.createElement('div')
  card.className = 'timeline-skip-floating-card'

  card.append(
    createTitleLine(playing, headingButtons),
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
  progress.append(createTrackProgressBar(track, onSeek))

  return [progress]
}

// 넘치는지는 화면에 붙여놓고 재봐야 안다. 짧은 제목까지 흔들리면 읽기만 힘들어진다.
export function startTitleMarquee(root) {
  const title = root.querySelector(TITLE_SELECTOR)

  if (title === null) {
    return
  }

  const overflowPixels = title.querySelector(TITLE_TEXT_SELECTOR).scrollWidth - title.clientWidth

  if (overflowPixels <= 0) {
    return
  }

  title.classList.add('is-scrolling')
  title.style.setProperty('--timeline-skip-marquee-distance', `-${overflowPixels}px`)
  title.style.setProperty('--timeline-skip-marquee-duration', `${toMarqueeSeconds(overflowPixels)}s`)
}

function toMarqueeSeconds(overflowPixels) {
  const scrollSeconds = overflowPixels / MARQUEE_PIXELS_PER_SECOND

  return Math.max(MARQUEE_MINIMUM_SECONDS, Math.round(scrollSeconds / MARQUEE_SCROLL_RATIO))
}

function createTitleLine({ title, meta }, headingButtons) {
  const heading = document.createElement('div')
  heading.className = 'timeline-skip-floating-heading'
  heading.append(createTitle(title), ...(meta === null ? [] : [createMeta(meta)]))

  const line = document.createElement('div')
  line.className = 'timeline-skip-floating-line'
  line.append(createEqualizerIcon(), heading, ...headingButtons)

  return line
}

function createMeta(meta) {
  const element = document.createElement('div')
  element.className = 'timeline-skip-floating-meta'
  element.textContent = meta

  return element
}

// 흐름이 꺼진 환경에서는 제목이 잘린 채로 남는다. 잘린 뒷부분은 툴팁으로 읽는다.
function createTitle(playingTitle) {
  const title = document.createElement('div')
  title.className = 'timeline-skip-floating-title'

  const text = document.createElement('span')
  text.className = 'timeline-skip-floating-title-text'

  // 댓글 본문은 남이 쓴 문자열이다. 항상 textContent로만 넣는다.
  text.textContent = playingTitle ?? NO_TRACK_LABEL

  title.append(text)
  title.title = text.textContent

  return title
}

function createButtonLine(view) {
  const line = document.createElement('div')
  line.className = 'timeline-skip-floating-line'

  line.append(createControls(view), createJumpButton(view.onRevealPanel))

  return line
}
