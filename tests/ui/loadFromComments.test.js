// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { startWithFakes, settle } from '../fixtures/fakes/startWithFakes.js'

// 합치기는 파서 뒤의 일이라 입력이 실측일 필요가 없다. 필요한 것은 타임라인이 담긴 댓글이
// 둘 이상이고, 뒤 댓글의 시각이 앞 댓글 사이로 끼어드는 배치뿐이다.
const FIRST_COMMENT = ['00:01 첫 곡', '10:00 셋째 곡'].join('\n')
const SECOND_COMMENT = '05:00 둘째 곡'
const PLAIN_COMMENT = '타임라인이 없는 평범한 댓글'
const REPLY_COMMENT = '02:00 대댓글 곡'

const LOAD_BANNER = '.timeline-skip-load-banner'
const LOAD_BUTTON = '.timeline-skip-load-button'
const TITLE = '.timeline-skip-row .timeline-skip-title'
const REPLIES = 'ytd-comment-replies-renderer'
const HEADER = '#timeline-skip-panel .timeline-skip-header'

describe('불러오기 안내 띠', () => {
  it('불러오기를 누르면 띠가 불러온 개수를 알리고 버튼이 사라진다', async () => {
    await startWithFakes({ commentTexts: [FIRST_COMMENT] })

    await clickLoad(document.querySelector(LOAD_BUTTON))

    expect(document.querySelector(LOAD_BANNER).textContent).toBe('2개를 목록에 불러왔어요')
    expect(document.querySelectorAll(LOAD_BUTTON)).toHaveLength(0)
  })

  it('목록을 비우면 띠가 다시 불러오기 상태로 돌아온다', async () => {
    await startWithFakes({ commentTexts: [FIRST_COMMENT] })
    await clickLoad(document.querySelector(LOAD_BUTTON))

    clearList()

    expect(document.querySelector(LOAD_BANNER).textContent).toContain('타임라인 2개를 찾았어요')
    expect(document.querySelectorAll(LOAD_BUTTON)).toHaveLength(1)
  })
})

describe('여러 댓글에서 불러오기', () => {
  it('타임라인이 담긴 댓글이 둘이면 불러오기 버튼도 둘 달린다', async () => {
    await startWithFakes({ commentTexts: [FIRST_COMMENT, PLAIN_COMMENT, SECOND_COMMENT] })

    expect(document.querySelectorAll(LOAD_BUTTON)).toHaveLength(2)
  })

  it('두 댓글을 모두 불러오면 시각 순으로 합쳐진다', async () => {
    await startWithFakes({ commentTexts: [FIRST_COMMENT, PLAIN_COMMENT, SECOND_COMMENT] })
    const [firstButton, secondButton] = document.querySelectorAll(LOAD_BUTTON)

    await clickLoad(firstButton)
    await clickLoad(secondButton)

    expect(readTitles()).toEqual(['첫 곡', '둘째 곡', '셋째 곡'])
  })
})

describe('대댓글에서 불러오기', () => {
  it('대댓글에도 불러오기 버튼이 달린다', async () => {
    await startWithFakes({ commentTexts: [{ text: PLAIN_COMMENT, replyTexts: [REPLY_COMMENT] }] })

    expect(document.querySelectorAll(`${REPLIES} ${LOAD_BUTTON}`)).toHaveLength(1)
  })

  it('대댓글에서 불러온 타임라인이 목록에 들어간다', async () => {
    await startWithFakes({ commentTexts: [{ text: PLAIN_COMMENT, replyTexts: [REPLY_COMMENT] }] })

    await clickLoad(document.querySelector(`${REPLIES} ${LOAD_BUTTON}`))

    expect(readTitles()).toEqual(['대댓글 곡'])
  })

  // 대댓글은 자기 thread 안에 들어 있어서 바깥 thread 셀렉터에도 함께 걸린다.
  // 버튼이 두 번 달리지 않는 것은 querySelectorAll이 같은 요소를 한 번만 돌려주기 때문이다.
  it('대댓글 thread가 중첩돼 있어도 버튼은 하나만 달린다', async () => {
    await startWithFakes({ commentTexts: [{ text: FIRST_COMMENT, replyTexts: [REPLY_COMMENT] }] })

    expect(document.querySelectorAll(`${REPLIES} ${LOAD_BUTTON}`)).toHaveLength(1)
    expect(document.querySelectorAll(LOAD_BUTTON)).toHaveLength(2)
  })
})

// 불러오기는 댓글 본문을 비동기로 읽는다. 누른 뒤 한 박자 쉬어야 목록과 띠가 바뀐다.
async function clickLoad(button) {
  button.click()
  await settle()
}

function clearList() {
  document.querySelector(`${HEADER} button[aria-label="더보기"]`).click()
  findByText(`${HEADER} [role="menu"] [role="menuitem"]`, '목록 비우기').click()
  findByText(`${HEADER} [role="alertdialog"] button`, '비우기').click()
}

function findByText(selector, text) {
  return [...document.querySelectorAll(selector)].find((element) => element.textContent === text)
}

function readTitles() {
  return [...document.querySelectorAll(TITLE)].map((title) => title.textContent)
}
