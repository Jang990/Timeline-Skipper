import { findLoopTarget } from './findLoopTarget.js'
import { findSkipTarget } from './findSkipTarget.js'

// 재생 위치가 바뀔 때마다 영상을 어디로 옮길지 정한다. 옮기지 않으면 null.
export function findPlaybackTarget({ tracks, disabledStartSeconds, loopEnabled, isEditing }, currentTimeSeconds) {
  // 편집 중에는 곡 경계를 들으며 맞춘다. 해제된 트랙이나 빈 구간을 들여다보는 순간 튕겨 나가면 맞출 수가 없다.
  if (isEditing) {
    return null
  }

  // 반복이 켜져 있으면 되감기가 먼저다. 그래야 영상 끝까지 갔다 오는 헛걸음이 없다.
  const loopTarget = loopEnabled ? findLoopTarget(tracks, disabledStartSeconds, currentTimeSeconds) : null

  return loopTarget ?? findSkipTarget(tracks, disabledStartSeconds, currentTimeSeconds)
}
