// 유튜브는 댓글을 스크롤에 맞춰 나중에 붙이고, 다른 영상으로 옮겨도 페이지를 새로 읽지 않는다.
// 그래서 한 번 훑고 끝낼 수 없고 DOM 변화를 계속 지켜봐야 한다.
const PAGE_SETTLE_MILLISECONDS = 300

// handler는 몇 번 불려도 같은 결과가 되도록(멱등) 만들어서 넘겨야 한다.
export function onPageChanged(handler) {
  let settleTimerId = null

  const observer = new MutationObserver(() => {
    clearTimeout(settleTimerId)
    settleTimerId = setTimeout(handler, PAGE_SETTLE_MILLISECONDS)
  })

  observer.observe(document.body, { childList: true, subtree: true })
  handler()
}

// 시청 페이지의 영상 식별자. 시청 페이지가 아니면 null이다.
export function readVideoId() {
  return new URL(location.href).searchParams.get('v')
}
