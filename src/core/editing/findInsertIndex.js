// 고친 시각이 목록의 몇 번째 자리로 들어가는지. 고치는 중인 트랙 자신은 세지 않는다.
// 목록은 시각 순으로 서므로 앞에 놓일 트랙의 수가 곧 그 자리다.
export function findInsertIndex(tracks, previousStartSeconds, startSeconds) {
  return tracks
    .filter((track) => track.startSeconds !== previousStartSeconds)
    .filter((track) => track.startSeconds < startSeconds).length
}
