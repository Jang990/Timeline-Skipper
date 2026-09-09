// 어느 요소에 전체화면이 걸렸는지는 플랫폼마다 다르다. 플레이어에 걸리면 나머지 화면이
// 아예 그려지지 않고, 문서 루트에 걸리면 페이지 위의 것들이 그대로 남는다.
// 무엇에 걸렸는지 몰라도 걸려 있는지만 알면 되므로 요소를 따지지 않는다.
export function isFullscreen() {
  return document.fullscreenElement !== null
}

export function onFullscreenChanged(handler) {
  document.addEventListener('fullscreenchange', handler)
}
