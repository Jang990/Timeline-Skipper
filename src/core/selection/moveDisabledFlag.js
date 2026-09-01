// 트랙의 정체성은 시작 시각이다. 시각을 고치면 체크 상태도 함께 따라가야 한다.
// toSeconds가 null이면 삭제로 본다. 그 시각의 표시만 사라진다.
export function moveDisabledFlag(disabledStartSeconds, fromSeconds, toSeconds) {
  const next = new Set(disabledStartSeconds)
  const wasDisabled = next.delete(fromSeconds)

  if (wasDisabled && toSeconds !== null) {
    next.add(toSeconds)
  }

  return next
}
