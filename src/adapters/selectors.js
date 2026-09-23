import { selectProfile } from './platformProfiles.js'

// 지금 열려 있는 페이지의 플랫폼. 셀렉터 값은 platformProfiles.js에만 있다.
export const CURRENT_PROFILE = selectProfile(location.hostname)

export const SELECTORS = CURRENT_PROFILE.selectors

// 플레이어 상태에 따라 붙었다 떨어지는 클래스. 늘 있는 요소가 아니라서 SELECTORS와 나눴다.
// ended는 2026-09-18 실제 시청 페이지에서 끝 너머로 옮겼을 때 붙는 것을 확인했다.
export const PLAYER_STATE_CLASSES = {
  ended: 'ended-mode'
}
