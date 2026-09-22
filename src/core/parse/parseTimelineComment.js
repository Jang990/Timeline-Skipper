const TITLE_WHEN_MISSING = '제목 없음'

// 브라우저가 넘겨주는 댓글 본문은 줄바꿈이 \r\n인 경우가 있다.
// \r를 남겨두면 정규식의 . 이 \r를 줄바꿈으로 보고 매치에 실패한다.
const LINE_BREAK = /\r\n|\r|\n/

// 두 정규식 모두 시각은 MM:SS 또는 H:MM:SS이고, 앞뒤 장식 기호를 허용한다.
// "(00:00)", "[00:00]", "▶ 00:01" 같은 형태가 실제 댓글에 흔하다.

// "00:01 곡명", "(00:00)곡명"
const LEADING_TIME_LINE = /^[\s([{<▶‣•·*\-–—]*(?:(\d{1,2}):)?(\d{1,3}):(\d{2})(?![\d:])[\s)\]}>]*(.*)$/

// "Maroon 5 - Sugar 3:12" 처럼 제목이 앞에 오는 목록도 있다.
// 줄 끝에 붙은 경우만 인정한다. 문장 중간의 시각까지 잡으면 평범한 댓글이 트랙으로 섞인다.
// 제목을 최소로 잡아야(non-greedy) "곡 1:02:33"에서 시각을 1:02:33 전체로 읽는다.
// 욕심내면 제목이 "곡 1:0", 시각이 2:33이 되어버린다.
const TRAILING_TIME_LINE = /^(.*?\S)[\s([{<▶‣•·*\-–—]*(?:(\d{1,2}):)?(\d{1,3}):(\d{2})[\s)\]}>]*$/

// 시각과 제목 사이에 흔히 들어가는 장식 기호. 제목의 일부가 아니다.
const SEPARATORS_AROUND_TITLE = /^[-~:|/,.·\s]+|[-~:|/,·\s]+$/g

// 공유 텍스트가 꺼 둔 트랙을 나타내는 표시. "-"처럼 댓글에 흔한 기호는 평범한 목록이
// 통째로 꺼져 들어오므로 쓰지 않는다. 제목 맨 앞에 있을 때만 표시로 본다.
const SKIP_MARK = '[skip]'

export function parseTimelineComment(commentText) {
  if (typeof commentText !== 'string') {
    return []
  }

  return commentText
    .split(LINE_BREAK)
    .map(parseLine)
    .filter((entry) => entry !== null)
}

function parseLine(line) {
  const leadingMatch = LEADING_TIME_LINE.exec(line)

  if (leadingMatch !== null) {
    const [, hoursText, minutesText, secondsText, restOfLine] = leadingMatch

    return toEntry(hoursText, minutesText, secondsText, restOfLine)
  }

  const trailingMatch = TRAILING_TIME_LINE.exec(line)

  if (trailingMatch !== null) {
    const [, titleText, hoursText, minutesText, secondsText] = trailingMatch

    return toEntry(hoursText, minutesText, secondsText, titleText)
  }

  return null
}

function toEntry(hoursText, minutesText, secondsText, titleText) {
  const hours = hoursText === undefined ? 0 : Number(hoursText)
  const minutes = Number(minutesText)
  const seconds = Number(secondsText)

  // 초는 언제나 60 미만. 시간 단위가 붙었다면 분도 60 미만이어야 시각으로 인정한다.
  if (seconds >= 60 || (hoursText !== undefined && minutes >= 60)) {
    return null
  }

  return readSkipMark({ timestampSeconds: hours * 3600 + minutes * 60 + seconds, title: extractTitle(titleText) })
}

// 표시가 없는 줄에는 isDisabled를 붙이지 않는다. 항목 모양은 그대로 두고 꺼 둔 줄만 표시를 더 든다.
// 빠른 추가의 제목만 쓴 줄은 시각이 없어 이 파서를 못 거치므로 따로 불러 쓴다.
export function readSkipMark(entry) {
  if (!entry.title.startsWith(SKIP_MARK)) {
    return entry
  }

  return { ...entry, title: extractTitle(entry.title.slice(SKIP_MARK.length)), isDisabled: true }
}

function extractTitle(titleText) {
  const title = titleText.replace(SEPARATORS_AROUND_TITLE, '').trim()

  return title === '' ? TITLE_WHEN_MISSING : title
}
