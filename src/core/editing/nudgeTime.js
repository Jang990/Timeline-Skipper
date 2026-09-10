// 조정 버튼 한 번의 결과. ⏱(지금 위치)는 재생 위치를 변화량 0으로 넘겨 같은 범위 안에 맞춘다.
// 재생 위치는 소수로 들어오므로 초 단위로 내린다.
export function nudgeStartSeconds(startSeconds, deltaSeconds, range, endSeconds) {
  // 끝이 비어 있으면 다음 트랙 시작이 사실상의 끝이다. 그것마저 모르면 뒤로는 막지 않는다.
  const limitSeconds = endSeconds ?? range.toSeconds
  const maxSeconds = limitSeconds === null ? Infinity : limitSeconds - 1

  return Math.min(Math.max(Math.floor(startSeconds + deltaSeconds), range.startMinSeconds), maxSeconds)
}

// 끝이 다음 트랙 시작(마지막 트랙이면 영상 끝)에 닿으면 null, 곧 "다음 트랙까지"로 돌린다.
// 경계값을 그대로 저장하면 나중에 다음 트랙을 옮겼을 때 없던 빈 구간이 생긴다.
export function nudgeEndSeconds(endSeconds, deltaSeconds, range, startSeconds) {
  // 빈 끝은 다음 트랙 시작까지라는 뜻이다. 그것마저 모르면 시작에서 출발한다.
  const baseSeconds = endSeconds ?? range.toSeconds ?? startSeconds
  const nudgedSeconds = Math.max(Math.floor(baseSeconds + deltaSeconds), startSeconds + 1)

  if (range.toSeconds !== null && nudgedSeconds >= range.toSeconds) {
    return null
  }

  return nudgedSeconds
}
