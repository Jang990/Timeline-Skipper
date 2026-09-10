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

  return uniqueEntries.map((entry, index) => {
    const boundarySeconds = uniqueEntries[index + 1]?.timestampSeconds ?? lastEndSeconds
    const trimmedEndSeconds = toTrimmedEndSeconds(entry, boundarySeconds)

    return {
      startSeconds: entry.timestampSeconds,
      endSeconds: trimmedEndSeconds ?? boundarySeconds,
      trimmedEndSeconds,
      title: entry.title
    }
  })
}

// 정렬이 끝난 뒤라 같은 시각은 이웃해 있다. 먼저 적힌 쪽을 남긴다.
function isFirstOfSameTimestamp(entry, index, entries) {
  return index === 0 || entry.timestampSeconds !== entries[index - 1].timestampSeconds
}

// 사람이 당겨둔 끝. 경계(다음 트랙 시작, 마지막이면 영상 끝)에 닿는 끝은 여기서 null이 된다.
// 재생이 쓰는 endSeconds와 갈라두지 않으면 화면이 둘을 구별하지 못해, 제목만 고쳐 저장해도
// 그때의 파생값이 끝으로 굳는다. 그 뒤 이웃 트랙을 옮기면 뜻하지 않은 빈 구간이 생긴다.
//
// 경계를 넘는 끝을 그대로 두면 트랙이 겹치고, "한 시각에 트랙 하나"라는 전제가 무너진다.
function toTrimmedEndSeconds(entry, boundarySeconds) {
  if (!Number.isFinite(entry.endSeconds) || entry.endSeconds <= entry.timestampSeconds) {
    return null
  }

  // 경계를 모르면(라이브, 길이 미확정) 적어둔 끝 시각이 유일한 근거다.
  if (boundarySeconds === null) {
    return entry.endSeconds
  }

  return entry.endSeconds < boundarySeconds ? entry.endSeconds : null
}
