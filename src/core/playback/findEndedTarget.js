// 플레이어가 영상이 끝났다고 알렸을 때 되돌아갈 지점. 되돌아가지 않으면 null.
// 끝났다는 것 자체가 마지막 트랙을 지났다는 뜻이라 재생 시각은 보지 않는다.
export function findEndedTarget({ tracks, disabledStartSeconds, loopEnabled, isEditing, isTurnedOff }) {
  if (!loopEnabled || isEditing || isTurnedOff) {
    return null
  }

  const firstEnabledTrack = tracks.find((track) => !disabledStartSeconds.has(track.startSeconds))

  return firstEnabledTrack?.startSeconds ?? null
}
