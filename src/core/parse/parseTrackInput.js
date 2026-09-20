import { parseTimelineComment } from './parseTimelineComment.js'

// 콜론 없이 숫자만 친 입력. 여섯 자리(HHMMSS)까지만 시각으로 본다.
const DIGITS_ONLY = /^\d{1,6}$/

// 시각 칸의 문자열은 댓글 한 줄과 형식이 같다. 파서를 그대로 재사용한다.
// 덕분에 "4:29"뿐 아니라 "(4:29) 곡명"을 통째로 붙여넣어도 읽어낸다.
export function parseTrackInput(timeText, titleText) {
  const parsed = parseTimelineComment(toColonForm(timeText.trim()))[0]

  if (parsed === undefined) {
    return null
  }

  const title = titleText.trim()

  // 콜론으로 친 입력은 댓글 한 줄과 같아서 제목이 딸려올 수 있다.
  // 숫자만 친 입력은 콜론 형식으로 바뀌어 들어오므로 제목이 붙을 자리가 없다.
  return {
    timestampSeconds: parsed.timestampSeconds,
    title: title === '' ? parsed.title : title
  }
}

// 숫자를 뒤에서부터 두 자리씩 끊는다. 마지막 두 자리가 초, 그 앞이 분, 나머지가 시다.
// "53" → "00:53", "1840" → "18:40", "10423" → "1:04:23"
//
// 값 검증(초 60 미만 등)은 하지 않는다. 콜론 형식으로 바꿔 넘기면
// 기존 파서가 콜론으로 친 입력과 똑같은 기준으로 걸러준다.
function toColonForm(timeText) {
  if (!DIGITS_ONLY.test(timeText)) {
    return timeText
  }

  const seconds = timeText.slice(-2).padStart(2, '0')
  const minutes = timeText.slice(-4, -2).padStart(2, '0')
  const hours = timeText.slice(0, -4)

  return hours === '' ? `${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`
}
