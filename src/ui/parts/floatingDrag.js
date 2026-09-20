import { exceedsDragThreshold } from '../../core/floating/exceedsDragThreshold.js'
import { clampFloatingPosition, toDraggedPosition } from '../../core/floating/floatingPosition.js'

const DRAGGING_CLASS = 'is-dragging'
const PICTURE_IN_PICTURE_CLASS = 'is-picture-in-picture'

// 버튼과 진행 바는 각자 할 일이 있다. 그 위에서 시작한 누름은 옮기려는 뜻이 아니다.
const INTERACTIVE_SELECTOR = 'button, input, a, [role="slider"]'
const ICON_SELECTOR = '.timeline-skip-floating-icon'

// 위젯을 그 자리에 놓는다. 저장된 자리가 없으면 인라인 값을 걷어 CSS가 쥔 기본 자리로 돌려준다.
// PiP 창에서는 위젯이 창을 꽉 채운다. 창을 옮기는 것은 브라우저의 몫이라 자리를 정하지 않는다.
export function placeFloating(root, position, isPictureInPicture) {
  // 끄는 동안에는 손이 자리를 쥐고 있다. 재생 중에는 그리라는 요청이 쉬지 않고 들어오는데,
  // 여기서 끼어들면 아직 저장 전인 옛 자리로 위젯이 되돌아가 손과 번갈아 깜빡인다.
  if (root.classList.contains(DRAGGING_CLASS)) {
    return
  }

  applyPlacement(root, isPictureInPicture ? null : clampFloatingPosition(position, readBounds(root)))
}

function applyPlacement(root, placed) {
  if (placed === null) {
    root.style.removeProperty('right')
    root.style.removeProperty('bottom')

    return
  }

  root.style.right = `${placed.rightPixels}px`
  root.style.bottom = `${placed.bottomPixels}px`
}

// 끄는 동안에는 위젯이 손만 따라가게 두고, 놓을 때 한 번만 저장한다.
// 움직일 때마다 저장하면 한 번 끄는 사이에 저장이 수십 번 일어난다.
export function bindFloatingDrag(root, onMoved) {
  const session = { drag: null, moved: false }

  root.addEventListener('pointerdown', (event) => startDrag(session, root, event))
  root.addEventListener('pointermove', (event) => followPointer(session, root, event))
  root.addEventListener('pointerup', () => endDrag(session, root, onMoved))

  // 브라우저가 끌기를 빼앗으면(스크롤 제스처 등) 사람이 놓은 것이 아니다. 자리를 저장하지 않는다.
  root.addEventListener('pointercancel', () => cancelDrag(session, root))

  // 손을 떼면 브라우저가 click을 한 번 더 보낸다. 버튼이 듣기 전에 가로채야 해서 캡처 단계에 붙인다.
  root.addEventListener('click', (event) => blockClickAfterDrag(session, event), true)
}

function startDrag(session, root, event) {
  if (event.button !== 0 || !canGrab(root, event.target)) {
    return
  }

  session.drag = {
    pointerId: event.pointerId,
    fromXPixels: event.clientX,
    fromYPixels: event.clientY,
    startPosition: readPosition(root),
    position: null
  }
  session.moved = false
}

function followPointer(session, root, event) {
  const { drag } = session

  if (drag === null) {
    return
  }

  const movement = { xPixels: event.clientX - drag.fromXPixels, yPixels: event.clientY - drag.fromYPixels }

  if (!session.moved && !exceedsDragThreshold(movement)) {
    return
  }

  // 포인터는 여기서 처음 붙든다. 누르자마자 붙들면 뒤따르는 click이 버튼 대신 위젯으로 올라가
  // 아이콘을 눌러도 펼쳐지지 않는다.
  if (!session.moved) {
    root.setPointerCapture?.(drag.pointerId)
  }

  session.moved = true
  drag.position = toDraggedPosition({ startPosition: drag.startPosition, movement, bounds: readBounds(root) })
  root.classList.add(DRAGGING_CLASS)
  applyPlacement(root, drag.position)
}

function endDrag(session, root, onMoved) {
  const finished = session.drag

  session.drag = null
  root.classList.remove(DRAGGING_CLASS)

  if (finished?.position != null) {
    onMoved(finished.position)
  }
}

function cancelDrag(session, root) {
  session.drag = null
  session.moved = false
  root.classList.remove(DRAGGING_CLASS)
}

function blockClickAfterDrag(session, event) {
  if (!session.moved) {
    return
  }

  session.moved = false
  event.stopPropagation()
  event.preventDefault()
}

function canGrab(root, target) {
  if (root.classList.contains(PICTURE_IN_PICTURE_CLASS)) {
    return false
  }

  // 접힌 아이콘은 통째로 버튼이지만 그것 말고 잡을 곳이 없다. 움직인 거리로 펼치기와 갈라낸다.
  if (target.closest(ICON_SELECTOR) !== null) {
    return true
  }

  return target.closest(INTERACTIVE_SELECTOR) === null
}

// 저장된 값이 아니라 화면에 실제로 놓인 자리에서 출발한다. 저장분이 없는 첫 끌기도 이 값으로 시작한다.
function readPosition(root) {
  const box = root.getBoundingClientRect()
  const view = root.ownerDocument.defaultView

  return { rightPixels: view.innerWidth - box.right, bottomPixels: view.innerHeight - box.bottom }
}

function readBounds(root) {
  const box = root.getBoundingClientRect()
  const view = root.ownerDocument.defaultView

  return {
    widgetWidthPixels: box.width,
    widgetHeightPixels: box.height,
    viewportWidthPixels: view.innerWidth,
    viewportHeightPixels: view.innerHeight
  }
}
