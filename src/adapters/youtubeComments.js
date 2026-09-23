import { SELECTORS } from './selectors.js'
import { createIcon } from '../ui/icons.js'

const BANNER_CLASS = 'timeline-skip-load-banner'
const BUTTON_CLASS = 'timeline-skip-load-button'
const RESET_EVENT = 'timeline-skip-load-reset'
const COMMENT_TEXT_SELECTOR = `${SELECTORS.commentThread} ${SELECTORS.commentText}`

// 접히는 플랫폼에서는 펼치기 전까지 몇 개인지 알 수 없다. 모르는 수를 적어 두면
// 불러온 뒤의 수와 어긋나므로, 찾았다는 것만 알리고 개수는 불러온 뒤에 말한다.
const SHOWS_COUNT_BEFORE_LOAD = SELECTORS.commentExpandButton === null

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

    if (countTimelines(textElement.innerText) > 0) {
      textElement.insertAdjacentElement('beforebegin', createBanner(textElement, { countTimelines, onLoad }))
    }
  }
}

// 목록을 비웠으면 이미 불러온 댓글도 다시 불러올 수 있어야 한다.
export function resetLoadButtons() {
  for (const banner of document.querySelectorAll(`.${BANNER_CLASS}`)) {
    banner.dispatchEvent(new Event(RESET_EVENT))
  }
}

// 치지직은 긴 댓글의 뒷부분을 DOM에서 아예 잘라내고 펼치기 버튼으로 끝낸다. 눌러야 나머지가 붙는다.
// 클릭 직후에는 옛 본문이고 다음 마이크로태스크에 갱신된다(2026-09-23 실측). 한 프레임 뒤에 읽는다.
// 한 번 펼치면 되접을 방법이 없으므로, 사용자가 불러오기를 누른 댓글에서만 펼친다.
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
function createBanner(textElement, { countTimelines, onLoad }) {
  const banner = document.createElement('div')
  banner.className = BANNER_CLASS

  const showIdle = () => {
    banner.classList.remove('is-loaded')
    banner.replaceChildren(
      createIcon('list'),
      createIdleMessage(countTimelines(textElement.innerText)),
      createLoadButton(async () => {
        const commentText = await expandAndReadText(textElement)

        onLoad(commentText)
        showLoaded(banner, countTimelines(commentText))
      })
    )
  }

  banner.addEventListener(RESET_EVENT, showIdle)
  showIdle()
  return banner
}

// 불러온 뒤에는 접힌 부분까지 읽었으므로 어느 플랫폼이든 개수를 말할 수 있다.
function showLoaded(banner, timelineCount) {
  const message = document.createElement('span')
  message.textContent = `${timelineCount}개를 목록에 불러왔어요`
  banner.classList.add('is-loaded')
  banner.replaceChildren(createIcon('check'), message)
}

function createIdleMessage(timelineCount) {
  const message = document.createElement('span')

  if (!SHOWS_COUNT_BEFORE_LOAD) {
    message.append(createBold('타임라인'), '을 찾았어요')

    return message
  }

  message.append(createBold(`타임라인 ${timelineCount}개`), '를 찾았어요')

  return message
}

function createBold(text) {
  const bold = document.createElement('b')
  bold.textContent = text

  return bold
}

function createLoadButton(onClick) {
  const button = document.createElement('button')
  button.className = BUTTON_CLASS
  button.type = 'button'
  button.textContent = '불러오기'
  button.addEventListener('click', onClick)
  return button
}
