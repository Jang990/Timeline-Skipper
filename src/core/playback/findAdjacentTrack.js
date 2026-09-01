import { findTrackAtTime } from '../tracks/findTrackAtTime.js'

// 곡 중간에서 "이전"을 누르면 그 곡의 처음으로 돌아간다. 음악 플레이어의 관습이다.
// 이 시간 안이면 "방금 넘어왔다"고 보고 한 곡 더 앞으로 보낸다.
const RESTART_THRESHOLD_SECONDS = 3

// direction은 'next' 또는 'previous'. 갈 곳이 없으면 null.
export function findAdjacentTrack(tracks, disabledStartSeconds, currentTimeSeconds, direction) {
  // 해제한 트랙으로는 이동시키지 않는다. 어차피 재생하면 건너뛸 구간이다.
  const enabledTracks = tracks.filter((track) => !disabledStartSeconds.has(track.startSeconds))

  if (direction === 'next') {
    const nextTrack = enabledTracks.find((track) => track.startSeconds > currentTimeSeconds)

    return nextTrack?.startSeconds ?? null
  }

  return findPreviousStart(enabledTracks, currentTimeSeconds)
}

function findPreviousStart(enabledTracks, currentTimeSeconds) {
  const currentTrack = findTrackAtTime(enabledTracks, currentTimeSeconds)

  if (currentTrack !== null && currentTimeSeconds - currentTrack.startSeconds > RESTART_THRESHOLD_SECONDS) {
    return currentTrack.startSeconds
  }

  const boundarySeconds = currentTrack?.startSeconds ?? currentTimeSeconds
  const previousTrack = enabledTracks.findLast((track) => track.startSeconds < boundarySeconds)

  return previousTrack?.startSeconds ?? null
}
