const TITLE_SELECTOR = '.timeline-skip-floating-title'
const TITLE_TEXT_SELECTOR = '.timeline-skip-floating-title-text'
const SCROLLING_CLASS = 'is-scrolling'

// 흐르는 속도를 고정한다. 제목이 길수록 오래 걸려야 읽는 속도가 제목마다 달라지지 않는다.
const MARQUEE_PIXELS_PER_SECOND = 24
const MARQUEE_MINIMUM_SECONDS = 5

// 한 바퀴에서 글자가 실제로 흐르는 구간의 비율. floatingMarquee.css의 키프레임(8% → 78%)과 짝이다.
// 나머지는 양 끝에서 멈춰 있는 시간과 처음으로 돌아오는 시간이라 속도 계산에서 빼야 한다.
const MARQUEE_SCROLL_RATIO = 0.7

// 넘치는지는 화면에 붙여놓고 재봐야 안다. 짧은 제목까지 흔들리면 읽기만 힘들어진다.
// PiP 창은 사람이 크기를 바꾸고, 그때 위젯은 다시 그려지지 않는다. 칸이나 글자의 크기가 바뀌면
// 그 자리에서 다시 잰다. 글자까지 지켜보는 것은 글꼴이 늦게 들어와 글자 폭만 바뀌는 경우 때문이다.
export function startTitleMarquee(root) {
  const title = root.querySelector(TITLE_SELECTOR)

  if (title === null) {
    return
  }

  const text = title.querySelector(TITLE_TEXT_SELECTOR)
  applyMarquee(title, text)
  watchSize(title, text)
}

// 위젯이 PiP 창에 있으면 그 창의 ResizeObserver를 써야 그 창의 레이아웃을 따라간다.
function watchSize(title, text) {
  const View = title.ownerDocument.defaultView

  if (typeof View?.ResizeObserver !== 'function') {
    return
  }

  const observer = new View.ResizeObserver(() => {
    // 다시 그리면 제목이 통째로 갈린다. 떨어져 나간 제목은 더 볼 이유가 없다.
    if (!title.isConnected) {
      observer.disconnect()

      return
    }

    applyMarquee(title, text)
  })

  observer.observe(title)
  observer.observe(text)
}

function applyMarquee(title, text) {
  const overflowPixels = text.scrollWidth - title.clientWidth

  if (overflowPixels <= 0) {
    title.classList.remove(SCROLLING_CLASS)

    return
  }

  title.classList.add(SCROLLING_CLASS)
  title.style.setProperty('--timeline-skip-marquee-distance', `-${overflowPixels}px`)
  title.style.setProperty('--timeline-skip-marquee-duration', `${toMarqueeSeconds(overflowPixels)}s`)
}

function toMarqueeSeconds(overflowPixels) {
  const scrollSeconds = overflowPixels / MARQUEE_PIXELS_PER_SECOND

  return Math.max(MARQUEE_MINIMUM_SECONDS, Math.round(scrollSeconds / MARQUEE_SCROLL_RATIO))
}
