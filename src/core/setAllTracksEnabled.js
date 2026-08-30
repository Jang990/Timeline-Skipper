// 비활성 목록을 트랙 목록으로부터 새로 만든다.
// 이전 비활성 집합을 받지 않으므로, 지금 목록에 없는 시각(영상 길이 밖으로 밀려난 것 등)은
// 자연스럽게 정리된다.
export function setAllTracksEnabled(tracks, isEnabled) {
  if (isEnabled) {
    return new Set()
  }

  return new Set(tracks.map((track) => track.startSeconds))
}
