import { findTrackAtTime } from '../tracks/findTrackAtTime.js'

export function findSkipTarget(tracks, disabledStartSeconds, currentTimeSeconds) {
  // 전체 해제는 몇 곡만 다시 고르기 직전의 중간 단계다.
  // 이때 영상 끝으로 보내면 자동재생이 다음 영상으로 넘겨버리므로 평소처럼 재생한다.
  if (isEveryTrackDisabled(tracks, disabledStartSeconds)) {
    return null
  }

  if (!shouldLeaveHere(tracks, disabledStartSeconds, currentTimeSeconds)) {
    return null
  }

  const nextEnabledTrack = tracks.find(
    (track) =>
      track.startSeconds > currentTimeSeconds && !disabledStartSeconds.has(track.startSeconds)
  )

  // 남은 트랙이 전부 해제됐으면 영상 끝으로 보낸다.
  // 끝 시각을 모르면(null) 보낼 곳이 없으므로 그대로 둔다.
  return nextEnabledTrack?.startSeconds ?? tracks.at(-1).endSeconds
}

function isEveryTrackDisabled(tracks, disabledStartSeconds) {
  return tracks.every((track) => disabledStartSeconds.has(track.startSeconds))
}

// 트랙들이 영상을 빈틈없이 나누므로 떠나야 하는 자리는 해제된 트랙 안뿐이다.
// 첫 트랙 시작 전과 마지막 트랙이 끝난 뒤는 트랙 밖이라 건드리지 않는다.
function shouldLeaveHere(tracks, disabledStartSeconds, currentTimeSeconds) {
  const currentTrack = findTrackAtTime(tracks, currentTimeSeconds)

  return currentTrack !== null && disabledStartSeconds.has(currentTrack.startSeconds)
}
