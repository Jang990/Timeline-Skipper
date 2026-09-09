import { createCard, startTitleMarquee } from './parts/floatingBar.js'
import { createButton } from './elements.js'

const FLOATING_ID = 'timeline-skip-floating'

// 접힘이 기본이다. 아이콘과 카드는 CSS로 숨기는 대신 서로 갈아끼운다.
// 화면에 있는 것이 곧 상태라야, 눌렀을 때 무엇이 달라졌는지가 눈에 보인다.
let isExpanded = false

// 재생 중에는 그리라는 요청이 쉬지 않고 들어온다. 보이는 것이 같으면 건너뛴다.
let lastSignature = null
let lastView = null

export function render(view) {
  lastView = view

  // 목록이 없는 영상에서까지 떠 있으면 그냥 거슬리는 물건이 된다.
  // 전체화면은 영상만 보겠다는 뜻이라 마찬가지로 치운다. 건너뛰기는 위젯 없이도 돈다.
  if (view.tracks.length === 0 || view.isFullscreen) {
    removeWidget()

    return
  }

  const playingTitle = findPlayingTitle(view)
  const signature = toSignature(view, playingTitle)
  const root = document.getElementById(FLOATING_ID)

  if (root !== null && signature === lastSignature) {
    return
  }

  lastSignature = signature
  drawInto(root ?? createRoot(), view, playingTitle)
}

function drawInto(root, view, playingTitle) {
  root.classList.toggle('is-expanded', isExpanded)
  root.replaceChildren(isExpanded ? createCard(view, playingTitle, () => setExpanded(false)) : createIcon())

  // 제목 폭은 붙인 뒤에야 잴 수 있다.
  startTitleMarquee(root)
}

function createIcon() {
  return createButton({
    label: '♪',
    className: 'timeline-skip-floating-icon',
    title: '플레이어 펼치기',
    ariaLabel: '플레이어 펼치기',
    onClick: () => setExpanded(true)
  })
}

function setExpanded(nextExpanded) {
  isExpanded = nextExpanded
  render(lastView)
}

function createRoot() {
  const root = document.createElement('div')
  root.id = FLOATING_ID
  document.body.append(root)

  return root
}

function removeWidget() {
  document.getElementById(FLOATING_ID)?.remove()

  // 다음에 목록이 생기면 처음부터 다시 그려야 한다.
  lastSignature = null
}

function findPlayingTitle({ tracks, playingStartSeconds }) {
  return tracks.find((track) => track.startSeconds === playingStartSeconds)?.title ?? null
}

// 위젯에 보이는 것은 이 넷뿐이다. 목록이 바뀌어도 이 넷이 그대로면 다시 그릴 이유가 없다.
function toSignature({ isPaused, loopEnabled }, playingTitle) {
  return `${playingTitle}#${isPaused}#${loopEnabled}#${isExpanded}`
}
