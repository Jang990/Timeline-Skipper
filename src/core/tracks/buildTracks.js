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
    endSeconds:
      index + 1 < uniqueEntries.length ? uniqueEntries[index + 1].timestampSeconds : lastEndSeconds,
    title: entry.title
  }))
}

// 정렬이 끝난 뒤라 같은 시각은 이웃해 있다. 먼저 적힌 쪽을 남긴다.
function isFirstOfSameTimestamp(entry, index, entries) {
  return index === 0 || entry.timestampSeconds !== entries[index - 1].timestampSeconds
}
