import { findLoopTarget } from './findLoopTarget.js'
import { findSkipTarget } from './findSkipTarget.js'

// 재생 위치가 흐를 때 옮겨갈 곳. 옮기지 않아도 되면 null.
export function findPlaybackTarget({ tracks, disabledStartSeconds, loopEnabled, isEditing }, currentTimeSeconds) {
  // 편집 중에는 사람이 끝 너머를 들으며 실제 끝을 찾는다. 이때 재생 위치를 옮기면 지금 위치로 찍을 수 없다.
  if (isEditing) {
    return null
  }

  // 반복이 켜져 있으면 되감기가 먼저다. 그래야 영상 끝까지 갔다 오는 헛걸음이 없다.
  const loopTarget = loopEnabled ? findLoopTarget(tracks, disabledStartSeconds, currentTimeSeconds) : null

  return loopTarget ?? findSkipTarget(tracks, disabledStartSeconds, currentTimeSeconds)
}
