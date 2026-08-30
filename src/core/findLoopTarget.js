// 마지막 트랙이 끝났을 때 되돌아갈 지점. 되돌아갈 때가 아니면 null.
// 해제된 트랙은 없는 것으로 치므로, 마지막 곡을 해제해두면 그 앞 곡이 끝날 때 돌아간다.
export function findLoopTarget(tracks, disabledStartSeconds, currentTimeSeconds) {
  const enabledTracks = tracks.filter((track) => !disabledStartSeconds.has(track.startSeconds))

  if (enabledTracks.length === 0) {
    return null
  }

  const lastEndSeconds = enabledTracks.at(-1).endSeconds

  // 끝 시각을 모르면(라이브, 길이 미확정) 언제 끝났는지 알 수 없다.
  if (lastEndSeconds === null || currentTimeSeconds < lastEndSeconds) {
    return null
  }

  return enabledTracks[0].startSeconds
}
