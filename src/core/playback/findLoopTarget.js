// 플레이어는 영상 길이까지 가지 않고 조금 앞에서 멈출 수 있다(9942.221초 영상이 9942.046초에서 멈췄다).
// 멈춘 뒤에는 시각이 더 흐르지 않으니, 끝에 닿기를 기다리면 되감을 기회가 오지 않는다.
// 1초는 관찰한 차이(최대 0.65초)에 재생 시각 알림 간격(약 0.25초)을 더한 값이다.
const END_MARGIN_SECONDS = 1

// 마지막 트랙이 끝났을 때 되돌아갈 지점. 되돌아갈 때가 아니면 null.
// 해제된 트랙은 없는 것으로 치므로, 마지막 곡을 해제해두면 그 앞 곡이 끝날 때 돌아간다.
export function findLoopTarget(tracks, disabledStartSeconds, currentTimeSeconds) {
  const enabledTracks = tracks.filter((track) => !disabledStartSeconds.has(track.startSeconds))

  if (enabledTracks.length === 0) {
    return null
  }

  const lastEndSeconds = enabledTracks.at(-1).endSeconds

  // 끝 시각을 모르면(라이브, 길이 미확정) 언제 끝났는지 알 수 없다.
  if (lastEndSeconds === null || currentTimeSeconds < lastEndSeconds - END_MARGIN_SECONDS) {
    return null
  }

  return enabledTracks[0].startSeconds
}
