// 플랫폼마다 다른 것은 셀렉터와 영상 ID를 읽는 법 둘뿐이다. 한 곳에 모아 호스트로 고른다.
// 마크업이 바뀌면 고칠 파일은 여기 하나여야 한다.
//
// 유튜브 값은 2026-08-27·2026-09-18 실제 시청 페이지에서 확인했다.
// 치지직 값은 2026-09-23 실제 다시보기 페이지에서 확인했다.
const CHZZK_HOSTNAME = 'chzzk.naver.com'

// 치지직은 다시보기 말고 라이브·채널 페이지에서도 주소가 바뀐다. 경로 마지막 칸을 그냥 쓰면
// 채널 ID를 영상 ID로 잘못 읽는다.
const CHZZK_VIDEO_PATH = /^\/video\/([^/]+)\/?$/

export const PLATFORM_PROFILES = {
  youtube: {
    selectors: {
      video: 'video.html5-main-video',
      player: '#movie_player',
      panelContainer: '#secondary-inner',
      twoColumnLayout: 'ytd-watch-flexy[is-two-columns_]',
      narrowPanelContainer: '#below',
      commentThread: 'ytd-comment-thread-renderer',
      commentText: '#content-text'
    },

    videoIdFrom: (url) => url.searchParams.get('v'),

    // 유튜브는 끝까지 재생해도 video의 ended를 켜지 않는다. 그 자리에서 멈추고 플레이어에
    // 이 표시만 붙인다. 2026-09-18 실제 시청 페이지에서 확인했다.
    playerEndedClass: 'ended-mode'
  },

  chzzk: {
    selectors: {
      video: 'video.webplayer-internal-video',
      player: '#player_layout',

      // 채팅 칸(#vod-aside)은 자식이 position: absolute라 그 안에 넣으면 패널이 채팅에 가려진다.
      // 오른쪽 열의 다음 칸에 넣는다 — 채팅 아래, "영상 더보기" 위다.
      // 치지직 클래스 뒤의 해시는 빌드마다 바뀔 수 있어 이름 앞부분만 맞춘다.
      panelContainer: '[class^="_content_right_"]',

      // 창이 좁아져도 오른쪽 칸이 사라지지 않는다. 패널을 옮길 자리가 없다.
      twoColumnLayout: null,
      narrowPanelContainer: null,

      commentThread: '[id^="commentBox-"]',
      commentText: '[class^="_text_"]'
    },

    videoIdFrom: (url) => url.pathname.match(CHZZK_VIDEO_PATH)?.[1] ?? null,

    // 치지직은 표준 ended 이벤트를 준다(2026-09-23 확인). 감시할 표시가 없다.
    playerEndedClass: null
  }
}

// 확장은 manifest에 적은 두 호스트에서만 돈다. 치지직이 아니면 유튜브다.
// jsdom 테스트와 e2e 픽스처도 이 기본값 덕분에 유튜브 마크업 위에서 그대로 돈다.
export function selectProfile(hostname) {
  return hostname === CHZZK_HOSTNAME ? PLATFORM_PROFILES.chzzk : PLATFORM_PROFILES.youtube
}
