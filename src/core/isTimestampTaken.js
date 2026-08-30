// 한 시각에 트랙은 하나뿐이다. 저장 전에 물어보고, 겹치면 사용자에게 되돌린다.
// 고치는 중인 트랙 자신은 제외해야 "제목만 바꾸기"가 막히지 않는다.
//
// 보이지 않는 항목(영상 길이 밖으로 밀려난 것)까지 겹침으로 치면
// 화면에 없는 것 때문에 막히는 셈이라, 판단 대상은 목록에 보이는 트랙뿐이다.
export function isTimestampTaken(tracks, timestampSeconds, previousTimestampSeconds) {
  if (timestampSeconds === previousTimestampSeconds) {
    return false
  }

  return tracks.some((track) => track.startSeconds === timestampSeconds)
}
