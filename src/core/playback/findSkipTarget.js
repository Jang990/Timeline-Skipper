import { findTrackAtTime } from '../tracks/findTrackAtTime.js'

export function findSkipTarget(tracks, disabledStartSeconds, currentTimeSeconds) {
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

// 떠나야 하는 자리는 두 가지다. 해제된 트랙 안, 그리고 트랙과 트랙 사이의 빈 구간.
function shouldLeaveHere(tracks, disabledStartSeconds, currentTimeSeconds) {
  const currentTrack = findTrackAtTime(tracks, currentTimeSeconds)

  return currentTrack === null
    ? isBetweenTracks(tracks, currentTimeSeconds)
    : disabledStartSeconds.has(currentTrack.startSeconds)
}

// 첫 트랙 시작 전과 마지막 트랙이 끝난 뒤도 트랙 밖이지만, 그 둘은 건드리지 않는다.
// 특히 뒤쪽을 빼두지 않으면 이미 지나온 지점으로 끝없이 되감는다.
function isBetweenTracks(tracks, currentTimeSeconds) {
  return (
    tracks.some((track) => track.startSeconds <= currentTimeSeconds) &&
    tracks.some((track) => track.startSeconds > currentTimeSeconds)
  )
}
