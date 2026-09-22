// 복사는 버튼을 누른 직후에 불린다. 사용자 동작이 있어 권한 없이도 쓰기가 허락된다.
export function writeText(text) {
  return navigator.clipboard.writeText(text)
}
