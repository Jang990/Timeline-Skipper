import { findTrackAtTime } from './findTrackAtTime.js'

export function findSkipTarget(tracks, disabledStartSeconds, currentTimeSeconds) {
  const currentTrack = findTrackAtTime(tracks, currentTimeSeconds)

  // 첫 트랙 시작 전이거나, 지금 트랙이 켜져 있으면 건드리지 않는다.
  if (currentTrack === null || !disabledStartSeconds.has(currentTrack.startSeconds)) {
    return null
  }

  const nextEnabledTrack = tracks
    .slice(tracks.indexOf(currentTrack) + 1)
    .find((track) => !disabledStartSeconds.has(track.startSeconds))

  // 남은 트랙이 전부 해제됐으면 영상 끝으로 보낸다.
  // 끝 시각을 모르면(null) 보낼 곳이 없으므로 그대로 둔다.
  return nextEnabledTrack?.startSeconds ?? tracks.at(-1).endSeconds
}
