// 조정 버튼 한 번의 결과. [지금]은 재생 위치를 변화량 0으로 넘겨 같은 범위 안에 맞춘다.
// 재생 위치는 소수로 들어오므로 초 단위로 내린다.
export function nudgeStartSeconds(startSeconds, deltaSeconds, range) {
  // 다음 트랙 시작이 사실상의 끝이다. 그것마저 모르면 뒤로는 막지 않는다.
  const maxSeconds = range.toSeconds === null ? Infinity : range.toSeconds - 1

  return Math.min(Math.max(Math.floor(startSeconds + deltaSeconds), range.startMinSeconds), maxSeconds)
}
