import { createCard, startTitleMarquee } from './parts/floatingBar.js'
import { createCollapseButton, createPictureInPictureButton } from './parts/floatingButtons.js'
import { createButton } from './elements.js'
import { formatTimestamp } from './formatTimestamp.js'
import { createEqualizerIcon } from './icons.js'
import { showTrackProgress } from './parts/trackProgressBar.js'

const FLOATING_ID = 'timeline-skip-floating'
const PICTURE_IN_PICTURE_CLASS = 'is-picture-in-picture'

// 재생 중에는 그리라는 요청이 쉬지 않고 들어온다. 보이는 것이 같으면 건너뛴다.
let lastSignature = null

// view.pictureInPictureDocument가 있으면 위젯은 탭을 떠나 그 창에 그려진다. 한 번에 한 곳에만 있다.
export function render(view) {
  const targetDocument = view.pictureInPictureDocument ?? document

  if (!shouldShow(view)) {
    removeWidget()

    // 보여줄 것이 없는데 창만 떠 있으면 빈 창이 화면을 가린다.
    view.onClosePictureInPicture()

    return
  }

  // 창으로 옮겨 갔으면 탭에 남은 것은 치운다.
  if (targetDocument !== document) {
    document.getElementById(FLOATING_ID)?.remove()
  }

  const playing = describePlaying(view)
  const signature = toSignature(view, playing)
  const existingRoot = targetDocument.getElementById(FLOATING_ID)
  const root = existingRoot ?? createRoot(targetDocument)

  if (existingRoot === null || signature !== lastSignature) {
    lastSignature = signature
    drawInto(root, view, playing)
  }

  // 다시 그리지 않아도 진행 바의 자리는 재생 위치를 따라가야 한다.
  showTrackProgress(root, view.getCurrentTimeSeconds())
}

// 목록이 없는 영상에서까지 떠 있으면 그냥 거슬리는 물건이 된다.
// 전체화면은 영상만 보겠다는 뜻이라 탭의 위젯은 치운다. 건너뛰기는 위젯 없이도 돈다.
// PiP 창은 탭 밖에 있어 전체화면을 가리지 않으므로 그대로 둔다.
function shouldShow({ tracks, floatingHidden, isFullscreen, pictureInPictureDocument }) {
  if (tracks.length === 0 || floatingHidden) {
    return false
  }

  return !isFullscreen || pictureInPictureDocument !== null
}

// 아이콘과 카드는 CSS로 숨기는 대신 서로 갈아끼운다.
// 화면에 있는 것이 곧 상태라야, 눌렀을 때 무엇이 달라졌는지가 눈에 보인다.
// PiP 창은 펼친 카드에서만 열린다. 창 안에서는 접기와 PiP 버튼을 빼서 펼친 채로 둔다. 창은 창의 X로 닫는다.
function drawInto(root, view, playing) {
  const isPictureInPicture = view.pictureInPictureDocument !== null

  root.classList.toggle(PICTURE_IN_PICTURE_CLASS, isPictureInPicture)
  root.classList.toggle('is-expanded', view.floatingExpanded)
  root.replaceChildren(
    view.floatingExpanded
      ? createCard(view, playing, isPictureInPicture ? [] : createHeadingButtons(view))
      : createIcon(view)
  )

  // 제목 폭은 붙인 뒤에야 잴 수 있다.
  startTitleMarquee(root)
}

// PiP를 못 여는 브라우저에서는 눌러도 아무 일이 없는 버튼이 된다. 그럴 바엔 두지 않는다.
function createHeadingButtons(view) {
  const collapseButton = createCollapseButton(() => view.onSetFloatingExpanded(false))

  if (!view.canOpenPictureInPicture) {
    return [collapseButton]
  }

  return [createPictureInPictureButton(view.onOpenPictureInPicture), collapseButton]
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

function createRoot(targetDocument) {
  const root = document.createElement('div')
  root.id = FLOATING_ID
  targetDocument.body.append(root)

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
    return { title: null, meta: null, track: null }
  }

  const track = tracks[trackIndex]
  const { title, startSeconds, endSeconds } = track
  const span = Number.isFinite(endSeconds)
    ? `${formatTimestamp(startSeconds)} – ${formatTimestamp(endSeconds)}`
    : formatTimestamp(startSeconds)

  return { title, meta: `${trackIndex + 1} / ${tracks.length} · ${span}`, track }
}

// 위젯에 보이는 것은 이것뿐이다. 목록이 바뀌어도 이 값들이 그대로면 다시 그릴 이유가 없다.
// 진행 바의 범위는 순번 줄의 시각과 같아서 따로 적지 않는다.
function toSignature({ isPaused, loopEnabled, floatingExpanded }, { title, meta }) {
  return `${title}#${meta}#${isPaused}#${loopEnabled}#${floatingExpanded}`
}
