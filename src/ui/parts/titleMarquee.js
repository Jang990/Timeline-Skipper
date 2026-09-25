const TITLE_SELECTOR = '.timeline-skip-floating-title'
const TITLE_TEXT_SELECTOR = '.timeline-skip-floating-title-text'
const SCROLLING_CLASS = 'is-scrolling'

// 가운데 구간에서 흐르는 속도. 제목 길이와 상관없이 같다. 조금 넘친 제목도 같은 속도로 밀려야 움직이는 게 보인다.
const MARQUEE_PIXELS_PER_SECOND = 24

// 멈춤은 초로 정한다. 한 바퀴의 비율로 두면 조금 넘친 제목은 멈춤까지 순식간에 지나가 떨리는 것처럼 보인다.
// 끝에서 처음으로는 빨리 돌아온다. 되돌아오며 읽히는 글자가 없어야 눈이 첫 글자만 기다리면 된다.
const START_PAUSE_SECONDS = 1.5
const END_PAUSE_SECONDS = 1
const RETURN_SECONDS = 0.5

// 조금 넘친 제목은 정속으로 밀면 눈 깜짝할 새에 끝나 툭 끊긴다. 흐르는 시간에 바닥을 둔다.
const MINIMUM_SCROLL_SECONDS = 0.8

// 출발과 도착만 부드럽게 하고 가운데는 거의 정속으로 둔다. 가운데가 흔들리면 읽는 속도가 흔들린다.
const SCROLL_EASING = 'cubic-bezier(0.3, 0, 0.7, 1)'

// 출발과 도착을 늦춘 만큼 가운데가 평균보다 이만큼 빠르다(위 곡선의 가운데 기울기).
// 흐르는 시간을 그만큼 늘려야 가운데가 정한 속도가 된다.
const SCROLL_EASING_MIDDLE_SLOPE = 1.4

// 넘치는지는 화면에 붙여놓고 재봐야 안다. 짧은 제목까지 흔들리면 읽기만 힘들어진다.
// PiP 창은 사람이 크기를 바꾸고, 그때 위젯은 다시 그려지지 않는다. 칸이나 글자의 크기가 바뀌면
// 그 자리에서 다시 잰다. 글자까지 지켜보는 것은 글꼴이 늦게 들어와 글자 폭만 바뀌는 경우 때문이다.
export function startTitleMarquee(root) {
  const title = root.querySelector(TITLE_SELECTOR)

  if (title === null) {
    return
  }

  const marquee = { title, text: title.querySelector(TITLE_TEXT_SELECTOR), overflowPixels: 0, animation: null }
  applyMarquee(marquee)
  watchSize(marquee)
}

// 위젯이 PiP 창에 있으면 그 창의 ResizeObserver를 써야 그 창의 레이아웃을 따라간다.
function watchSize(marquee) {
  const View = marquee.title.ownerDocument.defaultView

  if (typeof View?.ResizeObserver !== 'function') {
    return
  }

  const observer = new View.ResizeObserver(() => {
    // 다시 그리면 제목이 통째로 갈린다. 떨어져 나간 제목은 더 볼 이유가 없다.
    if (!marquee.title.isConnected) {
      observer.disconnect()

      return
    }

    applyMarquee(marquee)
  })

  observer.observe(marquee.title)
  observer.observe(marquee.text)
}

// 넘친 폭이 그대로면 돌던 애니메이션을 그대로 둔다. 새로 걸면 흐르던 글자가 처음으로 튄다.
function applyMarquee(marquee) {
  const overflowPixels = Math.max(0, marquee.text.scrollWidth - marquee.title.clientWidth)

  if (overflowPixels === marquee.overflowPixels) {
    return
  }

  marquee.overflowPixels = overflowPixels
  marquee.animation?.cancel()
  marquee.animation = null
  marquee.title.classList.toggle(SCROLLING_CLASS, overflowPixels > 0)

  if (overflowPixels > 0 && !prefersReducedMotion(marquee.title)) {
    marquee.animation = marquee.text.animate(toKeyframes(overflowPixels), {
      duration: toCycleSeconds(overflowPixels) * 1000,
      iterations: Infinity
    })
  }
}

// 움직임을 줄이도록 설정한 사람에게 흐르는 글자는 읽기가 아니라 방해다. 그때는 CSS가 말줄임을 붙인다.
function prefersReducedMotion(title) {
  return title.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function toScrollSeconds(overflowPixels) {
  return Math.max(MINIMUM_SCROLL_SECONDS, (overflowPixels / MARQUEE_PIXELS_PER_SECOND) * SCROLL_EASING_MIDDLE_SLOPE)
}

function toCycleSeconds(overflowPixels) {
  return START_PAUSE_SECONDS + toScrollSeconds(overflowPixels) + END_PAUSE_SECONDS + RETURN_SECONDS
}

function toKeyframes(overflowPixels) {
  const cycleSeconds = toCycleSeconds(overflowPixels)
  const scrollSeconds = toScrollSeconds(overflowPixels)
  const scrollStart = START_PAUSE_SECONDS / cycleSeconds
  const scrollEnd = (START_PAUSE_SECONDS + scrollSeconds) / cycleSeconds
  const returnStart = (START_PAUSE_SECONDS + scrollSeconds + END_PAUSE_SECONDS) / cycleSeconds
  const shifted = `translateX(-${overflowPixels}px)`

  return [
    { offset: 0, transform: 'translateX(0)' },
    { offset: scrollStart, transform: 'translateX(0)', easing: SCROLL_EASING },
    { offset: scrollEnd, transform: shifted },
    { offset: returnStart, transform: shifted, easing: 'ease-in-out' },
    { offset: 1, transform: 'translateX(0)' }
  ]
}
