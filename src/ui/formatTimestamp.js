// 표시용 변환은 여기(경계)에서만 한다. 내부 계산은 전부 초 단위 숫자다.
// 목록과 편집 폼이 같은 형식을 보여야 해서 따로 뒀다.
export function formatTimestamp(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const pad = (value) => String(value).padStart(2, '0')

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}
