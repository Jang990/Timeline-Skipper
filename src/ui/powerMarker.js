// 패널과 댓글 띠는 떼어내지 않고 이 표시 하나로 CSS가 숨긴다(styles/powerOff.css).
// 떼어냈다 다시 붙이면 편집 중이던 칸과 스크롤 위치가 날아간다.
const TURNED_OFF_CLASS = 'timeline-skip-turned-off'

export function showTurnedOff(isTurnedOff) {
  document.documentElement.classList.toggle(TURNED_OFF_CLASS, isTurnedOff)
}
