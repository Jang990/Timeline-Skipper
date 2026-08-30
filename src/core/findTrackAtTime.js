// 끝 시각을 모르는 트랙(진행 중인 라이브)은 "영상 끝까지"로 본다.
function toEndSeconds(track) {
  return track.endSeconds === null ? Number.POSITIVE_INFINITY : track.endSeconds
}

// 시작 시각은 포함, 끝 시각은 제외. 그래야 경계에서 두 트랙에 동시에 속하지 않는다.
export function findTrackAtTime(tracks, currentTimeSeconds) {
  const found = tracks.find(
    (track) => currentTimeSeconds >= track.startSeconds && currentTimeSeconds < toEndSeconds(track)
  )

  return found ?? null
}
