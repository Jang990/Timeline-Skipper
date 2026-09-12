// 바가 보여줄 시간 범위. 이웃 사이(이전 트랙이 끝나는 곳 ~ 다음 트랙이 시작하는 곳)를 잡는다.
// 이 범위를 쓰는 이유는 영상 전체를 그리면 세 시간짜리에서 사 분짜리 트랙이 2%가 되어,
// 어느 쪽으로 얼마나 움직였는지가 화면에서 사라지기 때문이다.
const PADDING_RATIO = 0.1

export function findBarRange(tracks, previousStartSeconds, startSeconds, durationSeconds) {
  // 영상 길이를 모르면(라이브, 재생 준비 전) 오른쪽 끝을 정할 수 없다. 그리지 않는다.
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return null
  }

  // 고치는 중인 트랙 자신은 이웃이 아니다. 추가 중이면 previousStartSeconds가 null이라 걸러지는 것이 없다.
  const neighbors = tracks.filter((track) => track.startSeconds !== previousStartSeconds)

  // 이전 트랙이 아직 끝나지 않은 자리에 추가할 수 있다. 그때는 그 자리가 왼쪽 끝이다.
  const fromSeconds = Math.min(findPreviousEndSeconds(neighbors, startSeconds), startSeconds)
  const toSeconds = findNextStartSeconds(neighbors, startSeconds) ?? durationSeconds

  // 끝을 당기지 않은 이웃 옆에서는 이웃의 끝이 곧 이 트랙의 시작이다. 여유가 없으면
  // 트랙이 바의 가장자리에 붙어, 그쪽으로 움직일 수 있다는 것이 보이지 않는다.
  const paddingSeconds = (toSeconds - fromSeconds) * PADDING_RATIO

  return {
    fromSeconds: Math.max(fromSeconds - paddingSeconds, 0),
    toSeconds: Math.min(toSeconds + paddingSeconds, durationSeconds)
  }
}

function findPreviousEndSeconds(neighbors, startSeconds) {
  const previous = neighbors.filter((track) => track.startSeconds < startSeconds)

  if (previous.length === 0) {
    return 0
  }

  const nearest = previous.reduce((left, right) => (left.startSeconds > right.startSeconds ? left : right))

  return nearest.endSeconds ?? nearest.startSeconds
}

function findNextStartSeconds(neighbors, startSeconds) {
  const next = neighbors.filter((track) => track.startSeconds > startSeconds)

  return next.length === 0 ? null : Math.min(...next.map((track) => track.startSeconds))
}
