// 접힌 아이콘은 통째로 버튼이라 잡을 빈 곳이 없다. 누른 뒤 움직인 거리로 펼치기와 옮기기를 가른다.
// 손이 떨리는 정도로 자리가 바뀌면, 펼치려던 사람이 위젯을 놓치게 된다.
const THRESHOLD_PIXELS = 4

export function exceedsDragThreshold({ xPixels, yPixels }) {
  return Math.hypot(xPixels, yPixels) >= THRESHOLD_PIXELS
}
