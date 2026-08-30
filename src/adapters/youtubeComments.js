import { SELECTORS } from './selectors.js'

const BUTTON_CLASS = 'timeline-skip-load-button'
const COMMENT_TEXT_SELECTOR = `${SELECTORS.commentThread} ${SELECTORS.commentText}`

function findCommentTextElements() {
  return [...document.querySelectorAll(COMMENT_TEXT_SELECTOR)]
}

// 페이지가 바뀔 때마다 다시 불린다. 이미 버튼을 붙인 댓글은 건너뛴다.
// 타임라인 댓글은 본문이 길어서, 버튼을 본문 위에 붙여야 스크롤 없이 눈에 들어온다.
export function mountLoadButtons({ countTimelines, onLoad }) {
  for (const textElement of findCommentTextElements()) {
    const alreadyMounted = textElement.previousElementSibling?.classList.contains(BUTTON_CLASS)

    if (alreadyMounted) {
      continue
    }

    const timelineCount = countTimelines(textElement.innerText)

    if (timelineCount > 0) {
      textElement.insertAdjacentElement('beforebegin', createLoadButton(textElement, timelineCount, onLoad))
    }
  }
}

// 목록을 비웠으면 이미 누른 버튼도 다시 누를 수 있어야 한다.
export function resetLoadButtons() {
  for (const button of document.querySelectorAll(`.${BUTTON_CLASS}`)) {
    button.disabled = false
    button.textContent = toIdleLabel(Number(button.dataset.timelineCount))
  }
}

function createLoadButton(textElement, timelineCount, onLoad) {
  const button = document.createElement('button')
  button.className = BUTTON_CLASS
  button.type = 'button'
  button.dataset.timelineCount = String(timelineCount)
  button.textContent = toIdleLabel(timelineCount)

  button.addEventListener('click', () => {
    onLoad(textElement.innerText)
    button.textContent = `✓ ${timelineCount}개 불러옴`
    button.disabled = true
  })

  return button
}

function toIdleLabel(timelineCount) {
  return `타임라인 ${timelineCount}개 불러오기`
}
