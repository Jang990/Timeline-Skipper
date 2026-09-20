// 위젯은 오른쪽 아래를 기준으로 놓인다. 접었다 펼치면 폭이 48px과 340px 사이를 오가는데,
// 왼쪽 위를 기준으로 잡으면 그때마다 위젯이 옆으로 튀어 나간다.
// 그래서 오른쪽으로 끌수록 rightPixels는 줄어든다.
const MINIMUM_PIXELS = 0

export function toDraggedPosition({ startPosition, movement, bounds }) {
  const dragged = {
    rightPixels: startPosition.rightPixels - movement.xPixels,
    bottomPixels: startPosition.bottomPixels - movement.yPixels
  }

  return clampFloatingPosition(dragged, bounds)
}

// 창이 좁아지거나 위젯이 커지면 저장된 자리가 화면 밖이 된다. 화면 밖으로 나간 위젯은
// 잡을 수가 없어서 되돌릴 방법도 함께 사라진다.
export function clampFloatingPosition(position, bounds) {
  if (position === null || position === undefined) {
    return null
  }

  return {
    rightPixels: clamp(position.rightPixels, bounds.viewportWidthPixels - bounds.widgetWidthPixels),
    bottomPixels: clamp(position.bottomPixels, bounds.viewportHeightPixels - bounds.widgetHeightPixels)
  }
}

// 위젯이 화면보다 크면 상한이 0보다 작아진다. 그때는 상한을 따라 왼쪽 위 끝에 맞춘다.
// 오른쪽 아래에 붙이면 정작 먼저 읽어야 할 제목과 버튼이 화면 밖으로 밀려난다.
function clamp(valuePixels, maximumPixels) {
  return Math.min(Math.max(valuePixels, MINIMUM_PIXELS), maximumPixels)
}
