import { SELECTORS } from './selectors.js'
import { createIcon } from '../ui/icons.js'

const BANNER_CLASS = 'timeline-skip-load-banner'
const BUTTON_CLASS = 'timeline-skip-load-button'
const RESET_EVENT = 'timeline-skip-load-reset'
const COMMENT_TEXT_SELECTOR = `${SELECTORS.commentThread} ${SELECTORS.commentText}`

function findCommentTextElements() {
  return [...document.querySelectorAll(COMMENT_TEXT_SELECTOR)]
}

// 페이지가 바뀔 때마다 다시 불린다. 이미 띠를 붙인 댓글은 건너뛴다.
// 타임라인 댓글은 본문이 길어서, 띠를 본문 위에 붙여야 스크롤 없이 눈에 들어온다.
export function mountLoadButtons({ countTimelines, onLoad }) {
  for (const textElement of findCommentTextElements()) {
    const alreadyMounted = textElement.previousElementSibling?.classList.contains(BANNER_CLASS)

    if (alreadyMounted) {
      continue
    }

    const timelineCount = countTimelines(textElement.innerText)

    if (timelineCount > 0) {
      textElement.insertAdjacentElement('beforebegin', createBanner(textElement, timelineCount, { countTimelines, onLoad }))
    }
  }
}

// 목록을 비웠으면 이미 불러온 댓글도 다시 불러올 수 있어야 한다.
export function resetLoadButtons() {
  for (const banner of document.querySelectorAll(`.${BANNER_CLASS}`)) {
    banner.dispatchEvent(new Event(RESET_EVENT))
  }
}

// 접힌 댓글은 뒷부분이 DOM에 없다. 펼치기 버튼을 눌러야 같은 노드의 본문이 늘어난다.
// 클릭 직후에는 옛 본문이고 다음 마이크로태스크에 갱신된다(2026-09-23 치지직 실측).
// 한 프레임을 기다렸다가 읽는다.
async function expandAndReadText(textElement) {
  const expandButton =
    SELECTORS.commentExpandButton === null ? null : textElement.querySelector(SELECTORS.commentExpandButton)

  if (expandButton === null) {
    return textElement.innerText
  }

  expandButton.click()
  await new Promise(requestAnimationFrame)

  return textElement.innerText
}

// 되돌릴 때 댓글 본문과 onLoad가 다시 필요하다. 띠가 되돌리기 이벤트를 스스로 들어서
// 그 둘을 어디에도 따로 보관하지 않는다.
function createBanner(textElement, timelineCount, { countTimelines, onLoad }) {
  const banner = document.createElement('div')
  banner.className = BANNER_CLASS

  const showIdle = () => {
    banner.classList.remove('is-loaded')
    banner.replaceChildren(createIcon('list'), createIdleMessage(timelineCount), createLoadButton(async () => {
      const commentText = await expandAndReadText(textElement)

      onLoad(commentText)
      showLoaded(banner, countTimelines(commentText))
    }))
  }

  banner.addEventListener(RESET_EVENT, showIdle)
  showIdle()
  return banner
}

function showLoaded(banner, timelineCount) {
  const message = document.createElement('span')
  message.textContent = `${timelineCount}개를 목록에 불러왔어요`
  banner.classList.add('is-loaded')
  banner.replaceChildren(createIcon('check'), message)
}

function createIdleMessage(timelineCount) {
  const message = document.createElement('span')
  const count = document.createElement('b')
  count.textContent = `타임라인 ${timelineCount}개`
  message.append(count, '를 찾았어요')
  return message
}

function createLoadButton(onClick) {
  const button = document.createElement('button')
  button.className = BUTTON_CLASS
  button.type = 'button'
  button.textContent = '불러오기'
  button.addEventListener('click', onClick)
  return button
}
