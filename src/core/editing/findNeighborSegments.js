// 바에 함께 그릴 이웃 트랙의 구간.
//
// 편집 중인 트랙의 시작을 경계 하나로 끼워 넣는 것이 이 함수의 전부다. 끝을 정해 두지 않은
// 트랙은 "다음 경계까지"라는 뜻이라, 편집 중에는 그 경계가 곧 편집 중인 시작이 된다.
// 그래서 앞 트랙의 끝을 값으로 채워 저장하지 않고도 그 끝이 시작을 따라온다.
export function findNeighborSegments(tracks, previousStartSeconds, startSeconds) {
  // 고치는 중인 트랙 자신은 이웃이 아니다. 추가 중이면 previousStartSeconds가 null이라 걸러지는 것이 없다.
  const neighbors = tracks
    .filter((track) => track.startSeconds !== previousStartSeconds)
    .sort((left, right) => left.startSeconds - right.startSeconds)

  const boundaries = [...neighbors.map((track) => track.startSeconds), startSeconds]

  return neighbors
    .map((track) => ({
      fromSeconds: track.startSeconds,
      toSeconds: findEndSeconds(track, findNextBoundary(boundaries, track.startSeconds))
    }))
    .filter((segment) => segment.toSeconds > segment.fromSeconds)
}

// 다음 경계를 넘으면 트랙이 겹친다. 끝을 정해 둔 트랙도 경계 앞에서 멈춘다.
function findEndSeconds(track, boundarySeconds) {
  const endSeconds = track.trimmedEndSeconds ?? boundarySeconds ?? track.endSeconds

  if (endSeconds === null || boundarySeconds === null) {
    return endSeconds
  }

  return Math.min(endSeconds, boundarySeconds)
}

function findNextBoundary(boundaries, startSeconds) {
  const later = boundaries.filter((boundarySeconds) => boundarySeconds > startSeconds)

  return later.length === 0 ? null : Math.min(...later)
}
