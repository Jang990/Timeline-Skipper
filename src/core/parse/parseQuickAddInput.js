import { parseTimelineComment, readSkipMark } from './parseTimelineComment.js'

const LINE_BREAK = /\r\n|\r|\n/

// 한 줄 칸에 들어온 글을 트랙 항목으로 읽는다.
// 한 줄이면 시각이 없어도 받는다. 듣다가 "여기부터 이 곡"이라고 제목만 적는 흐름이다.
// 여러 줄은 댓글을 붙여넣은 것이라 시각 있는 줄만 받는다. 설명 줄까지 지금 위치에 쌓이면 안 된다.
export function parseQuickAddInput(text, currentTimeSeconds) {
  const lines = text
    .split(LINE_BREAK)
    .map((line) => line.trim())
    .filter((line) => line !== '')

  if (lines.length === 1) {
    return [readSingleLine(lines[0], currentTimeSeconds)]
  }

  return lines.flatMap(parseTimelineComment).map((entry) => ({ ...entry, usesNow: false }))
}

function readSingleLine(line, currentTimeSeconds) {
  const [parsed] = parseTimelineComment(line)

  if (parsed !== undefined) {
    return { ...parsed, usesNow: false }
  }

  // 재생 준비 전이나 라이브에서는 재생 위치가 NaN이다. 그때는 0초로 둔다.
  const timestampSeconds = Number.isFinite(currentTimeSeconds) ? Math.floor(currentTimeSeconds) : 0

  // usesNow는 저장하지 않는 표시다. 미리보기가 "지금 위치"를 붙일지 가르는 데만 쓴다.
  return { ...readSkipMark({ timestampSeconds, title: line }), usesNow: true }
}
