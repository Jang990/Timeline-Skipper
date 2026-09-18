import { SELECTORS } from './selectors.js'

// 창이 좁으면 유튜브는 추천 영상 칸을 display:none으로 숨기고, 재생목록·채팅 같은 자기 부품만
// 영상 아래 칸으로 옮긴다. 우리 패널은 옮겨 주지 않으므로 같은 자리를 직접 골라야 보인다.
export function findPanelContainer() {
  const selector = isBelowVideo() ? SELECTORS.narrowPanelContainer : SELECTORS.panelContainer

  return document.querySelector(selector)
}

// 영상 아래 칸이 없는 페이지(픽스처 등)는 예전처럼 추천 영상 칸을 쓴다.
export function isBelowVideo() {
  const isTwoColumns = document.querySelector(SELECTORS.twoColumnLayout) !== null

  return !isTwoColumns && document.querySelector(SELECTORS.narrowPanelContainer) !== null
}
