import { CURRENT_PROFILE } from './selectors.js'

// 유튜브는 댓글을 스크롤에 맞춰 나중에 붙이고, 다른 영상으로 옮겨도 페이지를 새로 읽지 않는다.
// 그래서 한 번 훑고 끝낼 수 없고 DOM 변화를 계속 지켜봐야 한다.
const PAGE_SETTLE_MILLISECONDS = 300

// 치지직 다시보기는 채팅이 같은 문서에 계속 붙어서 잠잠해지는 순간이 거의 오지 않는다.
// 잠잠해지길 끝없이 기다리지 않고, 변화가 이어져도 이만큼 지나면 한 번은 부른다.
const PAGE_SETTLE_MAX_MILLISECONDS = 1000

// handler는 몇 번 불려도 같은 결과가 되도록(멱등) 만들어서 넘겨야 한다.
export function onPageChanged(handler) {
  let settleTimerId = null
  let maxWaitTimerId = null
  let lastHref = location.href

  const settle = () => {
    clearTimeout(settleTimerId)
    clearTimeout(maxWaitTimerId)
    maxWaitTimerId = null
    handler()
  }

  const observer = new MutationObserver(() => {
    clearTimeout(settleTimerId)
    maxWaitTimerId ??= setTimeout(settle, PAGE_SETTLE_MAX_MILLISECONDS)

    // 옮긴 직후엔 유튜브가 몇 초간 DOM을 계속 붙여 조용해지길 기다리면 이전 영상의 트랙이 남는다.
    // 주소가 바뀐 것만은 바로 알린다. 뒤늦게 붙는 댓글은 아래 타이머가 이어서 잡는다.
    if (location.href !== lastHref) {
      lastHref = location.href
      handler()
    }

    settleTimerId = setTimeout(settle, PAGE_SETTLE_MILLISECONDS)
  })

  observer.observe(document.body, { childList: true, subtree: true })
  handler()
}

// 시청 페이지의 영상 식별자. 시청 페이지가 아니면 null이다. 읽는 법은 플랫폼마다 다르다.
export function readVideoId() {
  return CURRENT_PROFILE.videoIdFrom(new URL(location.href))
}
