// 끝 언저리를 들어볼 자리. 끝은 값이 아니라 다음 트랙의 시작이라 범위에서 받아온다.
//
// 경계 시각은 이 트랙의 마지막이 아니라 다음 트랙의 첫 프레임이다. 거기로 보내면 다음 곡이
// 들려서 경계가 맞는지 알 수 없다. 마지막 트랙에서는 영상이 끝나 추천 영상까지 뜬다.
// 그래서 경계 앞에 세운다. 2초는 넘어가는 순간이 들릴 만큼이다.
const LEAD_SECONDS = 2

export function findEndSeekSeconds(startSeconds, toSeconds) {
  if (toSeconds === null) {
    return null
  }

  // 2초보다 짧은 트랙에서는 앞 트랙으로 넘어간다. 그런 트랙은 시작이 곧 끝 언저리다.
  return Math.max(startSeconds, toSeconds - LEAD_SECONDS)
}
