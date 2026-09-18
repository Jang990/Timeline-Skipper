// 유튜브 마크업이 바뀌면 고칠 파일은 여기 하나뿐이어야 한다.
// 아래 값은 2026-08-27 크롬 개발자 도구에서 실제 시청 페이지로 확인했다.
// twoColumnLayout과 narrowPanelContainer는 2026-09-18 실제 시청 페이지로 확인했다.
export const SELECTORS = {
  video: 'video.html5-main-video',
  panelContainer: '#secondary-inner',
  twoColumnLayout: 'ytd-watch-flexy[is-two-columns_]',
  narrowPanelContainer: '#below',
  commentThread: 'ytd-comment-thread-renderer',
  commentText: '#content-text'
}
