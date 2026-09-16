import { createButton } from '../elements.js'
import { createIcon } from '../icons.js'

// 패널 카드와 떠 있는 위젯이 함께 쓴다. 버튼을 한 줄로 세우기만 하고, 배치는 놓이는 곳이 정한다.
export function createControls({ isPaused, loopEnabled, onPrevious, onTogglePlay, onNext, onToggleLoop }) {
  const controls = document.createElement('div')
  controls.className = 'timeline-skip-controls'

  controls.append(
    createControlButton('previous', '이전 트랙', onPrevious),
    createControlButton(isPaused ? 'play' : 'pause', isPaused ? '재생' : '일시정지', onTogglePlay, 'is-primary'),
    createControlButton('next', '다음 트랙', onNext),
    createControlButton(
      'repeat',
      loopEnabled ? '반복 끄기' : '반복 켜기',
      onToggleLoop,
      loopEnabled ? 'is-loop is-active' : 'is-loop'
    )
  )

  return controls
}

function createControlButton(iconName, label, onClick, extraClass = '') {
  const button = createButton({
    label: '',
    className: `timeline-skip-control ${extraClass}`.trim(),
    title: label,
    ariaLabel: label,
    onClick
  })
  button.append(createIcon(iconName))

  return button
}
