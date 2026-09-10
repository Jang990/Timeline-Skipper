// 버튼으로 시각을 옮길 수 있는 범위. 이웃 트랙을 넘어가면 목록 순서가 바뀌므로 버튼은 그 앞에서 멈춘다.
// 순서를 바꾸는 이동은 직접 입력으로만 한다.
export function findEditRange(tracks, previousStartSeconds, startSeconds, durationSeconds) {
  // 고치는 중인 트랙 자신은 이웃이 아니다. 추가 중이면 previousStartSeconds가 null이라 걸러지는 것이 없다.
  const neighborStarts = tracks
    .map((track) => track.startSeconds)
    .filter((neighborStartSeconds) => neighborStartSeconds !== previousStartSeconds)

  // 같은 시각에 트랙이 이미 있으면 그 트랙을 앞 이웃으로 본다. 버튼 한 번에 겹침에서 벗어나게 하려는 것이다.
  const previousStarts = neighborStarts.filter((neighborStartSeconds) => neighborStartSeconds <= startSeconds)
  const nextStarts = neighborStarts.filter((neighborStartSeconds) => neighborStartSeconds > startSeconds)

  return {
    startMinSeconds: previousStarts.length === 0 ? 0 : Math.max(...previousStarts) + 1,
    toSeconds: nextStarts.length === 0 ? toKnownDuration(durationSeconds) : Math.min(...nextStarts)
  }
}

// 재생 준비 전이나 라이브에서는 영상 길이가 0 또는 NaN이다. 그때는 끝을 모르는 것으로 둔다.
function toKnownDuration(durationSeconds) {
  return Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : null
}
