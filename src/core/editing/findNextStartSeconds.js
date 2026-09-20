// 편집 중인 트랙 다음에 오는 트랙의 시작 시각. 그것이 곧 이 트랙의 끝이다.
// 마지막 트랙이면 영상 끝이고, 영상 길이를 모르면(라이브, 재생 준비 전) 끝을 알 수 없어 null이다.
export function findNextStartSeconds(tracks, previousStartSeconds, startSeconds, durationSeconds) {
  // 고치는 중인 트랙 자신은 이웃이 아니다. 추가 중이면 previousStartSeconds가 null이라 걸러지는 것이 없다.
  const nextStarts = tracks
    .map((track) => track.startSeconds)
    .filter((neighborStartSeconds) => neighborStartSeconds !== previousStartSeconds)
    .filter((neighborStartSeconds) => neighborStartSeconds > startSeconds)

  return nextStarts.length === 0 ? toKnownDuration(durationSeconds) : Math.min(...nextStarts)
}

// 재생 준비 전이나 라이브에서는 영상 길이가 0 또는 NaN이다. 그때는 끝을 모르는 것으로 둔다.
function toKnownDuration(durationSeconds) {
  return Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null
}
