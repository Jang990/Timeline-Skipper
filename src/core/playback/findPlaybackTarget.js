import { findLoopTarget } from './findLoopTarget.js'
import { findSkipTarget } from './findSkipTarget.js'

// 재생 위치가 흐를 때 옮겨갈 곳. 옮기지 않아도 되면 null.
export function findPlaybackTarget({ tracks, disabledStartSeconds, loopEnabled, isFollowing }, currentTimeSeconds) {
  // 사람이 재생 위치를 따라가며 끝을 찾는 동안에는 옮기지 않는다. 옮기면 따라가던 끝이 옮긴 자리로 튄다.
  if (isFollowing) {
    return null
  }

  // 반복이 켜져 있으면 되감기가 먼저다. 그래야 영상 끝까지 갔다 오는 헛걸음이 없다.
  const loopTarget = loopEnabled ? findLoopTarget(tracks, disabledStartSeconds, currentTimeSeconds) : null

  return loopTarget ?? findSkipTarget(tracks, disabledStartSeconds, currentTimeSeconds)
}
