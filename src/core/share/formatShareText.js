import { formatTimestamp } from '../time/formatTimestamp.js'

// 파서가 읽는 표시와 짝이다. 바꾸면 parseTimelineComment의 SKIP_MARK도 함께 바꾼다.
const SKIP_MARK = '[skip]'

// 받은 사람이 확장을 찾아올 수 있게 글 끝에 붙인다. 시각이 없는 줄이라
// 빠른 추가와 댓글 불러오기 모두 트랙으로 읽지 않는다.
// 링크는 넣지 않는다. 이 글은 유튜브 댓글에 붙여넣는 것이라, 외부 링크가 있으면
// 스팸 필터에 걸려 댓글이 숨겨질 수 있다. 확장은 이름으로 검색해 찾는다.
const PROMOTION_LINES = ['크롬 확장 Timeline Skipper로 만든 타임라인입니다. 좋아하는 부분만 골라 즐겨보세요.']

// 꺼 둔 트랙도 줄을 남긴다. 트랙의 끝은 다음 줄의 시작이라, 줄을 빼면 그 구간이
// 앞 트랙에 합쳐져 받은 쪽에서 건너뛸 구간이 재생된다.
export function formatShareText(tracks, disabledStartSeconds) {
  if (tracks.length === 0) {
    return ''
  }

  const trackLines = tracks.map((track) => toLine(track, disabledStartSeconds.has(track.startSeconds)))

  return [...trackLines, '', ...PROMOTION_LINES].join('\n')
}

function toLine({ startSeconds, title }, isDisabled) {
  const parts = [formatTimestamp(startSeconds), isDisabled ? SKIP_MARK : null, title]

  return parts.filter((part) => part !== null).join(' ')
}
