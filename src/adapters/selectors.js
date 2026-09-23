import { selectProfile } from './platformProfiles.js'

// 지금 열려 있는 페이지의 플랫폼. 셀렉터 값은 platformProfiles.js에만 있다.
export const CURRENT_PROFILE = selectProfile(location.hostname)

export const SELECTORS = CURRENT_PROFILE.selectors

