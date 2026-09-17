import { createCard, startTitleMarquee } from './parts/floatingBar.js'
import { createButton } from './elements.js'
import { formatTimestamp } from './formatTimestamp.js'
import { createEqualizerIcon } from './icons.js'

const FLOATING_ID = 'timeline-skip-floating'

// 재생 중에는 그리라는 요청이 쉬지 않고 들어온다. 보이는 것이 같으면 건너뛴다.
let lastSignature = null

export function render(view) {
  // 목록이 없는 영상에서까지 떠 있으면 그냥 거슬리는 물건이 된다.
  // 전체화면은 영상만 보겠다는 뜻이라 마찬가지로 치운다. 건너뛰기는 위젯 없이도 돈다.
  if (view.tracks.length === 0 || view.isFullscreen || view.floatingHidden) {
    removeWidget()

    return
  }

  const playing = describePlaying(view)
  const signature = toSignature(view, playing)
  const root = document.getElementById(FLOATING_ID)

  if (root !== null && signature === lastSignature) {
    return
  }

  lastSignature = signature
  drawInto(root ?? createRoot(), view, playing)
}

// 아이콘과 카드는 CSS로 숨기는 대신 서로 갈아끼운다.
// 화면에 있는 것이 곧 상태라야, 눌렀을 때 무엇이 달라졌는지가 눈에 보인다.
function drawInto(root, view, playing) {
  root.classList.toggle('is-expanded', view.floatingExpanded)
  root.replaceChildren(
    view.floatingExpanded
      ? createCard(view, playing, () => view.onSetFloatingExpanded(false))
      : createIcon(view)
  )

  // 제목 폭은 붙인 뒤에야 잴 수 있다.
  startTitleMarquee(root)
}

function createIcon(view) {
  const icon = createButton({
    label: '',
    className: 'timeline-skip-floating-icon',
    title: '플레이어 펼치기',
    ariaLabel: '플레이어 펼치기',
    onClick: () => view.onSetFloatingExpanded(true)
  })
  icon.append(createEqualizerIcon())

  return icon
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

// 순번 줄은 "2 / 8 · 05:00 – 10:00". 끝을 모르는 트랙(진행 중인 라이브)은 시작만 적는다.
function describePlaying({ tracks, playingStartSeconds }) {
  const trackIndex = tracks.findIndex((track) => track.startSeconds === playingStartSeconds)

  if (trackIndex === -1) {
    return { title: null, meta: null }
  }

  const { title, startSeconds, endSeconds } = tracks[trackIndex]
  const span = Number.isFinite(endSeconds)
    ? `${formatTimestamp(startSeconds)} – ${formatTimestamp(endSeconds)}`
    : formatTimestamp(startSeconds)

  return { title, meta: `${trackIndex + 1} / ${tracks.length} · ${span}` }
}

// 위젯에 보이는 것은 이것뿐이다. 목록이 바뀌어도 이 값들이 그대로면 다시 그릴 이유가 없다.
function toSignature({ isPaused, loopEnabled, floatingExpanded }, { title, meta }) {
  return `${title}#${meta}#${isPaused}#${loopEnabled}#${floatingExpanded}`
}
