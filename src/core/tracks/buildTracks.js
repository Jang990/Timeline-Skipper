// 영상 길이는 재생 준비 전이나 라이브 방송에서 0 또는 NaN으로 나온다.
// 그때는 길이를 근거로 한 판단(범위 필터, 마지막 트랙의 끝)을 아예 하지 않는다.
function isKnownDuration(videoDurationSeconds) {
  return Number.isFinite(videoDurationSeconds) && videoDurationSeconds > 0
}

export function buildTracks(entries, videoDurationSeconds) {
  const hasDuration = isKnownDuration(videoDurationSeconds)

  const sorted = [...entries].sort((left, right) => left.timestampSeconds - right.timestampSeconds)
  const withinVideo = hasDuration
    ? sorted.filter((entry) => entry.timestampSeconds < videoDurationSeconds)
    : sorted
  const uniqueEntries = withinVideo.filter(isFirstOfSameTimestamp)

  const lastEndSeconds = hasDuration ? videoDurationSeconds : null

  return uniqueEntries.map((entry, index) => ({
    startSeconds: entry.timestampSeconds,
    endSeconds: toEndSeconds(entry, uniqueEntries[index + 1]?.timestampSeconds ?? lastEndSeconds),
    title: entry.title
  }))
}

// 정렬이 끝난 뒤라 같은 시각은 이웃해 있다. 먼저 적힌 쪽을 남긴다.
function isFirstOfSameTimestamp(entry, index, entries) {
  return index === 0 || entry.timestampSeconds !== entries[index - 1].timestampSeconds
}

// 적어둔 끝 시각은 경계(다음 트랙 시작, 마지막이면 영상 끝)를 넘지 못한다. 넘게 두면 트랙이
// 겹치고, "한 시각에 트랙 하나"라는 전제 위에 선 재생 로직이 전부 무너진다.
// 경계보다 앞이면 그 사이가 어느 트랙에도 속하지 않는 빈 구간이 된다.
function toEndSeconds(entry, boundarySeconds) {
  if (!Number.isFinite(entry.endSeconds) || entry.endSeconds <= entry.timestampSeconds) {
    return boundarySeconds
  }

  // 경계를 모르면(라이브, 길이 미확정) 적어둔 끝 시각이 유일한 근거다.
  return boundarySeconds === null ? entry.endSeconds : Math.min(entry.endSeconds, boundarySeconds)
}
