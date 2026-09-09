import { PANEL_ID } from './panel.js'

const REVEAL_CLASS = 'is-revealed'
const REVEAL_MILLISECONDS = 1500

let revealTimerId = null

// 극장모드에서는 패널이 영상 아래로 밀려 화면 밖에 있다. 플로팅 위젯에서 부르면
// 거기까지 데려다주고, 목록이 어디 있는지 잠깐 표시해 눈이 찾을 자리를 알려준다.
export function reveal() {
  const panel = document.getElementById(PANEL_ID)

  if (panel === null) {
    return
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'center' })
  panel.classList.add(REVEAL_CLASS)

  clearTimeout(revealTimerId)
  revealTimerId = setTimeout(() => panel.classList.remove(REVEAL_CLASS), REVEAL_MILLISECONDS)
}
