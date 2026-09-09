import { createButton } from '../elements.js'

export function createHeader({ tracks, disabledStartSeconds, floatingHidden, onEnableAll, onDisableAll, onClear, onSetFloatingHidden }) {
  const header = document.createElement('div')
  header.className = 'timeline-skip-header'

  const title = document.createElement('span')
  title.textContent = toHeaderLabel(tracks, disabledStartSeconds)

  const actions = document.createElement('div')
  actions.className = 'timeline-skip-actions'
  actions.append(
    createActionButton('전체 선택', onEnableAll, tracks.length === 0),
    createActionButton('전체 해제', onDisableAll, tracks.length === 0),
    createActionButton('비우기', onClear, false),
    createActionButton(toFloatingLabel(floatingHidden), () => onSetFloatingHidden(!floatingHidden), false)
  )

  header.append(title, actions)

  return header
}

// 체크박스 하나로 전부 토글하는 대신 버튼 둘로 나눴다.
// 이 패널에서는 "전체 해제 후 몇 개만 고르기"가 주 사용 흐름이라 항상 한 번에 닿아야 한다.
// 글자가 곧 설명이라 툴팁과 aria-label을 따로 두지 않는다.
function createActionButton(label, onClick, isDisabled) {
  return createButton({ label, className: 'timeline-skip-action', isDisabled, onClick })
}

// 숨긴 위젯을 되돌리는 길은 여기 하나뿐이다. 목록이 비어도 눌러둘 수 있어야
// 다음 영상에서 위젯이 뜬다.
function toFloatingLabel(floatingHidden) {
  return floatingHidden ? '위젯 보이기' : '위젯 숨기기'
}

function toHeaderLabel(tracks, disabledStartSeconds) {
  if (tracks.length === 0) {
    return '타임라인'
  }

  const enabledCount = tracks.filter((track) => !disabledStartSeconds.has(track.startSeconds)).length

  return `타임라인 ${enabledCount}/${tracks.length}`
}
