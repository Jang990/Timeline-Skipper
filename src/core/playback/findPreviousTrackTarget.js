import { findAdjacentTrack } from './findAdjacentTrack.js'

// ⏮을 눌렀을 때 옮길 곳. 갈 곳이 없으면 null.
// 첫 트랙의 처음에서 한 번 더 눌러도 반응이 있어야 버튼이 먹혔는지 알 수 있다.
// 반복이 켜져 있으면 목록이 원처럼 이어지므로 마지막 트랙으로 넘어간다. ⏭이 끝에서 처음으로 가는 것과 짝이다.
export function findPreviousTrackTarget({ tracks, disabledStartSeconds, loopEnabled }, currentTimeSeconds) {
  const previousSeconds = findAdjacentTrack(tracks, disabledStartSeconds, currentTimeSeconds, 'previous')

  if (previousSeconds !== null) {
    return previousSeconds
  }

  const enabledTracks = tracks.filter((track) => !disabledStartSeconds.has(track.startSeconds))

  if (enabledTracks.length === 0) {
    return null
  }

  if (loopEnabled) {
    return enabledTracks.at(-1).startSeconds
  }

  // 첫 트랙 앞 구간은 트랙 밖이라 되감을 곡이 없다.
  const firstStartSeconds = enabledTracks[0].startSeconds

  return currentTimeSeconds >= firstStartSeconds ? firstStartSeconds : null
}
