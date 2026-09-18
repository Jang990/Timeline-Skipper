// 유튜브 마크업이 바뀌면 고칠 파일은 여기 하나뿐이어야 한다.
// 아래 값은 2026-08-27 크롬 개발자 도구에서 실제 시청 페이지로 확인했다.
// twoColumnLayout과 narrowPanelContainer는 2026-09-18 실제 시청 페이지로 확인했다.
export const SELECTORS = {
  video: 'video.html5-main-video',
  player: '#movie_player',
  panelContainer: '#secondary-inner',
  twoColumnLayout: 'ytd-watch-flexy[is-two-columns_]',
  narrowPanelContainer: '#below',
  commentThread: 'ytd-comment-thread-renderer',
  commentText: '#content-text'
}

// 플레이어 상태에 따라 붙었다 떨어지는 클래스. 늘 있는 요소가 아니라서 SELECTORS와 나눴다.
// ended는 2026-09-18 실제 시청 페이지에서 끝 너머로 옮겼을 때 붙는 것을 확인했다.
export const PLAYER_STATE_CLASSES = {
  ended: 'ended-mode'
}
