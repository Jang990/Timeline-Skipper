import { createCard } from './parts/floatingBar.js'
import { startTitleMarquee } from './parts/titleMarquee.js'
import { createCollapseButton, createPictureInPictureButton } from './parts/floatingButtons.js'
import { createButton } from './elements.js'
import { bindFloatingDrag, placeFloating } from './parts/floatingDrag.js'
import { createEqualizerIcon } from './icons.js'
import { showTrackProgress } from './parts/trackProgressBar.js'

const FLOATING_ID = 'timeline-skip-floating'
const PICTURE_IN_PICTURE_CLASS = 'is-picture-in-picture'

// 재생 중에는 그리라는 요청이 쉬지 않고 들어온다. 보이는 것이 같으면 건너뛴다.
let lastSignature = null

// 끌어 옮기는 손은 위젯을 만들 때 한 번만 붙인다. 그 뒤에 바뀐 view는 여기서 받아 간다.
let latestView = null

// view.pictureInPictureDocument가 있으면 위젯은 탭을 떠나 그 창에 그려진다. 한 번에 한 곳에만 있다.
export function render(view) {
  latestView = view
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

  // 창이 좁아지면 저장해 둔 자리가 화면 밖이 될 수 있다. 그릴 때마다 화면 안으로 들인다.
  placeFloating(root, view.floatingPosition, view.pictureInPictureDocument !== null)

  // 다시 그리지 않아도 진행 바의 자리는 재생 위치를 따라가야 한다.
  showTrackProgress(root, view.getCurrentTimeSeconds())
}

// 목록이 없는 영상에서까지 떠 있으면 그냥 거슬리는 물건이 된다.
// 전체화면은 영상만 보겠다는 뜻이라 탭의 위젯은 치운다. 건너뛰기는 위젯 없이도 돈다.
// PiP 창은 탭 밖에 있어 전체화면을 가리지 않으므로 그대로 둔다. 꺼 두었으면 PiP 창까지 치운다.
function shouldShow({ tracks, floatingHidden, isFullscreen, pictureInPictureDocument, isTurnedOff }) {
  if (isTurnedOff || tracks.length === 0 || floatingHidden) {
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
  bindFloatingDrag(root, (position) => latestView.onSetFloatingPosition(position))

  return root
}

function removeWidget() {
  document.getElementById(FLOATING_ID)?.remove()

  // 다음에 목록이 생기면 처음부터 다시 그려야 한다.
  lastSignature = null
}

// 순번 줄은 "2 / 8". 트랙 안의 시간은 진행 바 양옆이 맡는다.
function describePlaying({ tracks, playingStartSeconds }) {
  const trackIndex = tracks.findIndex((track) => track.startSeconds === playingStartSeconds)

  if (trackIndex === -1) {
    return { title: null, meta: null, track: null }
  }

  const track = tracks[trackIndex]

  return { title: track.title, meta: `${trackIndex + 1} / ${tracks.length}`, track }
}

// 위젯에 보이는 것은 이것뿐이다. 목록이 바뀌어도 이 값들이 그대로면 다시 그릴 이유가 없다.
// 트랙 길이는 다시 그려야만 바뀌므로 트랙의 범위도 함께 본다.
function toSignature({ isPaused, loopEnabled, floatingExpanded }, { title, meta, track }) {
  return `${title}#${meta}#${track?.startSeconds}#${track?.endSeconds}#${isPaused}#${loopEnabled}#${floatingExpanded}`
}
