const TITLE_WHEN_MISSING = '제목 없음'

// 브라우저가 넘겨주는 댓글 본문은 줄바꿈이 \r\n인 경우가 있다.
const LINE_BREAK = /\r\n|\r|\n/

// 시각은 MM:SS 또는 H:MM:SS. 줄 어디에 있든 트랙의 시작으로 본다.
// 순번과 괘선을 앞에 두거나("001 ┌ [00:48:52 곡]"), 한 줄에 두 곡을 적는
// ("1:00 곡 / 5:43 곡") 목록이 실제 댓글에 흔해서, 자리를 따지면 그 줄을 통째로 놓친다.
const TIME = /(?:(\d{1,2}):)?(\d{1,3}):(\d{2})(?![\d:])/g

// 시각과 제목 사이에 흔히 들어가는 장식. 제목의 일부가 아니다.
// 닫는 괄호는 "(00:00)곡명"처럼 시각을 감쌌던 쪽이라 앞에서만 뗀다.
const SEPARATORS_AROUND_TITLE = /^[-~:|/,.·\s)\]}>]+|[-~:|/,·\s]+$/g

// 공유 텍스트가 꺼 둔 트랙을 나타내는 표시. "-"처럼 댓글에 흔한 기호는 평범한 목록이
// 통째로 꺼져 들어오므로 쓰지 않는다. 제목 맨 앞에 있을 때만 표시로 본다.
const SKIP_MARK = '[skip]'

export function parseTimelineComment(commentText) {
  if (typeof commentText !== 'string') {
    return []
  }

  return commentText.split(LINE_BREAK).flatMap(parseLine)
}

function parseLine(line) {
  const matches = [...line.matchAll(TIME)]

  return matches.map((_, index) => toEntry(line, matches, index)).filter((entry) => entry !== null)
}

function toEntry(line, matches, index) {
  const [, hoursText, minutesText, secondsText] = matches[index]
  const hours = hoursText === undefined ? 0 : Number(hoursText)
  const minutes = Number(minutesText)
  const seconds = Number(secondsText)

  // 초는 언제나 60 미만. 시간 단위가 붙었다면 분도 60 미만이어야 시각으로 인정한다.
  if (seconds >= 60 || (hoursText !== undefined && minutes >= 60)) {
    return null
  }

  return readSkipMark({
    timestampSeconds: hours * 3600 + minutes * 60 + seconds,
    title: extractTitle(findTitleText(line, matches, index))
  })
}

// 제목은 시각 뒤부터 다음 시각 앞까지다.
// 뒤가 비어 있고 그 줄의 첫 시각이면 "Maroon 5 - Sugar 3:12"처럼 제목을 앞에 쓴 목록이다.
// 앞선 시각이 있을 때는 앞쪽이 그 트랙의 제목이므로 가져오지 않는다.
function findTitleText(line, matches, index) {
  const match = matches[index]
  const nextMatch = matches[index + 1]
  const afterTime = line.slice(match.index + match[0].length, nextMatch?.index ?? line.length)

  if (afterTime.trim() !== '' || index > 0) {
    return afterTime
  }

  return line.slice(0, match.index)
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
