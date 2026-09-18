import { createButton } from '../elements.js'
import { createHeaderMenu } from './headerMenu.js'

const TITLE_LABEL = '타임라인'

// 불러온 목록과 고친 내용은 어디에도 따로 남지 않는다. 한 번 누른 것으로 지우지 않는다.
const CLEAR_CONFIRMATION = {
  title: '목록을 비울까요?',
  detail: '불러온 타임라인과 체크 상태가 모두 지워지고 되돌릴 수 없습니다.',
  confirmLabel: '비우기'
}

export function createHeader(view) {
  const { tracks, onEnableAll, onDisableAll } = view
  const header = document.createElement('div')
  header.className = 'timeline-skip-header'

  const actions = document.createElement('div')
  actions.className = 'timeline-skip-actions'
  actions.append(
    createActionButton('전체 선택', onEnableAll, tracks.length === 0),
    createActionButton('전체 해제', onDisableAll, tracks.length === 0),
    createHeaderMenu(toMenuItems(view))
  )

  header.append(createHeading(view), actions)

  return header
}

// 제목은 늘 같고 수만 바뀐다. 따로 적어야 수가 눈에 먼저 들어온다.
function createHeading({ tracks, disabledStartSeconds }) {
  const title = document.createElement('span')
  title.className = 'timeline-skip-header-title'
  title.textContent = TITLE_LABEL

  const heading = document.createElement('div')
  heading.className = 'timeline-skip-header-heading'
  heading.append(title)

  if (tracks.length > 0) {
    const enabledCount = tracks.filter((track) => !disabledStartSeconds.has(track.startSeconds)).length
    const count = document.createElement('span')
    count.className = 'timeline-skip-header-count'
    count.textContent = `${enabledCount} / ${tracks.length}`
    heading.append(count)
  }

  return heading
}

// 체크박스 하나로 전부 토글하는 대신 버튼 둘로 나눴다.
// 이 패널에서는 "전체 해제 후 몇 개만 고르기"가 주 사용 흐름이라 항상 한 번에 닿아야 한다.
// 글자가 곧 설명이라 툴팁과 aria-label을 따로 두지 않는다.
function createActionButton(label, onClick, isDisabled) {
  return createButton({ label, className: 'timeline-skip-action', isDisabled, onClick })
}

// 드물게 쓰는 동작은 메뉴에 넣는다. 숨긴 위젯을 되돌리는 길은 여기 하나뿐이라,
// 목록이 비어도 메뉴는 늘 열린다. 그래야 다음 영상에서 위젯이 뜬다.
function toMenuItems({ floatingHidden, onClear, onSetFloatingHidden }) {
  return [
    {
      label: floatingHidden ? '위젯 보이기' : '위젯 숨기기',
      onSelect: () => onSetFloatingHidden(!floatingHidden)
    },
    { label: '목록 비우기', onSelect: onClear, isDestructive: true, confirmation: CLEAR_CONFIRMATION }
  ]
}
