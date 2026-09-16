// 바 위의 자리(0~1)를 시각으로 바꾼다. toBarRatio의 반대다.
// ±와 [지금으로]가 초 단위로 다루므로 옮길 시각도 초 단위로 내린다.
export function fromBarRatio(ratio, { fromSeconds, toSeconds }) {
  // 바의 폭이 0이면 자리가 Infinity나 NaN으로 들어온다. 엉뚱한 곳으로 옮기느니 옮기지 않는다.
  if (!Number.isFinite(ratio)) {
    return null
  }

  // 바 가장자리를 살짝 벗어나 누른 것도 바를 누른 것이다. 범위 밖으로 보내지 않는다.
  const clampedRatio = Math.min(Math.max(ratio, 0), 1)

  return Math.floor(fromSeconds + (toSeconds - fromSeconds) * clampedRatio)
}
