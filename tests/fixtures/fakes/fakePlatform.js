// 페이지 이동, 댓글, 전체화면은 플랫폼이 일으키는 일이다. 테스트가 그 순간을 직접 일으킬 수 있게 한다.

export function createFakePage({ videoId = 'fixture-video' } = {}) {
  let currentVideoId = videoId
  const handlers = []

  return {
    readVideoId: () => currentVideoId,

    // 진짜도 등록하자마자 한 번 부른다.
    onPageChanged: (handler) => {
      handlers.push(handler)
      handler()
    },

    // 영상을 바꾼 뒤 저장분을 다 읽을 때까지 기다릴 수 있게 약속을 돌려준다.
    navigateTo: (nextVideoId) => {
      currentVideoId = nextVideoId

      return Promise.all(handlers.map((handler) => handler()))
    }
  }
}

// 진짜는 댓글 옆에 버튼을 붙인다. jsdom은 innerText를 계산하지 못해서 버튼 대신
// 누르는 동작만 흉내 낸다. 버튼이 제자리에 붙는지는 e2e가 맡는다.
export function createFakeComments() {
  let mounted = null
  let resetCount = 0

  return {
    mountLoadButtons: (options) => {
      mounted = options
    },
    resetLoadButtons: () => {
      resetCount += 1
    },

    loadComment: (commentText) => mounted.onLoad(commentText),
    countTimelines: (commentText) => mounted.countTimelines(commentText),
    getResetCount: () => resetCount
  }
}

export function createFakeFullscreen() {
  let fullscreen = false
  const handlers = []

  return {
    isFullscreen: () => fullscreen,
    onFullscreenChanged: (handler) => handlers.push(handler),

    setFullscreen: (nextFullscreen) => {
      fullscreen = nextFullscreen
      handlers.forEach((handler) => handler())
    }
  }
}
