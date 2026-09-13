// ±가 옮길 재생 위치. 가운데 글씨와 [지금으로]는 재생 위치를 초 단위로 내려 쓴다.
// 같은 값에서 출발해야 누른 만큼만 글씨가 바뀌고, 찍히는 값도 글씨와 같다.
export function stepPlaybackSeconds(currentTimeSeconds, deltaSeconds, durationSeconds) {
  // 재생 준비 전에는 재생 위치가 NaN이다. 엉뚱한 곳으로 옮기느니 옮기지 않는다.
  if (!Number.isFinite(currentTimeSeconds)) {
    return null
  }

  const maxSeconds = Number.isFinite(durationSeconds) ? durationSeconds : Infinity

  return Math.min(Math.max(Math.floor(currentTimeSeconds) + deltaSeconds, 0), maxSeconds)
}
