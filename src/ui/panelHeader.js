export function createHeader({ tracks, disabledStartSeconds, onEnableAll, onDisableAll, onClear }) {
  const header = document.createElement('div')
  header.className = 'timeline-skip-header'

  const title = document.createElement('span')
  title.textContent = toHeaderLabel(tracks, disabledStartSeconds)

  const actions = document.createElement('div')
  actions.className = 'timeline-skip-actions'
  actions.append(
    createActionButton('전체 선택', onEnableAll, tracks.length === 0),
    createActionButton('전체 해제', onDisableAll, tracks.length === 0),
    createActionButton('비우기', onClear, false)
  )

  header.append(title, actions)

  return header
}

// 체크박스 하나로 전부 토글하는 대신 버튼 둘로 나눴다.
// 이 패널에서는 "전체 해제 후 몇 개만 고르기"가 주 사용 흐름이라 항상 한 번에 닿아야 한다.
function createActionButton(label, onClick, isDisabled) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'timeline-skip-action'
  button.textContent = label
  button.disabled = isDisabled
  button.addEventListener('click', onClick)

  return button
}

function toHeaderLabel(tracks, disabledStartSeconds) {
  if (tracks.length === 0) {
    return '타임라인'
  }

  const enabledCount = tracks.filter((track) => !disabledStartSeconds.has(track.startSeconds)).length

  return `타임라인 ${enabledCount}/${tracks.length}`
}
