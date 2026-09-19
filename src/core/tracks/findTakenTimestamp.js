import { isTimestampTaken } from './isTimestampTaken.js'

// 한 번에 여러 줄을 넣을 때 막을 시각을 찾는다. 목록에 이미 있는 시각뿐 아니라
// 붙여넣은 줄끼리 겹치는 시각도 막는다. 들어간 뒤 덮어써지면 어느 줄이 사라졌는지 알 수 없다.
export function findTakenTimestamp(entries, tracks) {
  const seen = new Set()

  for (const { timestampSeconds } of entries) {
    if (seen.has(timestampSeconds) || isTimestampTaken(tracks, timestampSeconds, null)) {
      return timestampSeconds
    }

    seen.add(timestampSeconds)
  }

  return null
}
