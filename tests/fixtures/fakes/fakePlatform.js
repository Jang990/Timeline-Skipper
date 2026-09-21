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

// 진짜는 크롬이 띄운 창의 문서를 돌려준다. jsdom은 창을 띄우지 못해서 빈 문서로 창을 대신한다.
// 사람이 창의 X를 눌러 닫는 것도 진짜에서는 close()와 같은 알림으로 이어진다.
export function createFakePictureInPicture({ isSupported = true } = {}) {
  let pictureInPictureDocument = null
  const handlers = []

  const setDocument = (nextDocument) => {
    pictureInPictureDocument = nextDocument
    handlers.forEach((handler) => handler())
  }

  return {
    isSupported: () => isSupported,
    getDocument: () => pictureInPictureDocument,
    onChanged: (handler) => handlers.push(handler),
    open: () => setDocument(document.implementation.createHTMLDocument('PiP')),

    close: () => {
      if (pictureInPictureDocument !== null) {
        setDocument(null)
      }
    }
  }
}

// 진짜는 백그라운드에 메시지를 보내 탭을 앞으로 올린다. jsdom에는 탭이 하나뿐이라 불린 횟수만 센다.
export function createFakeTabFocus() {
  let focusCount = 0

  return {
    focusTab: async () => {
      focusCount += 1
    },

    getFocusCount: () => focusCount
  }
}

// 진짜는 팝업이 chrome.storage에 쓴 값을 모든 탭이 알림으로 받는다. 테스트가 팝업 자리에서 스위치를 누른다.
export function createFakePower({ isTurnedOff = false } = {}) {
  let turnedOff = isTurnedOff
  const handlers = []

  return {
    readTurnedOff: async () => turnedOff,
    onTurnedOffChanged: (handler) => handlers.push(handler),

    setTurnedOff: (nextTurnedOff) => {
      turnedOff = nextTurnedOff
      handlers.forEach((handler) => handler(nextTurnedOff))
    }
  }
}
