import { createButton } from '../elements.js'
import { createIcon } from '../icons.js'

// 패널 카드와 떠 있는 위젯이 함께 쓴다. 버튼을 한 줄로 세우기만 하고, 배치는 놓이는 곳이 정한다.
export function createControls({ isPaused, loopEnabled, playingStartSeconds, onPrevious, onTogglePlay, onNext, onToggleLoop, onSkipPlaying }) {
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

  // 첫 트랙 앞 구간은 뺄 트랙이 없다. 눌러도 아무 일이 없는 버튼은 두지 않는다.
  if (playingStartSeconds !== null) {
    controls.append(createControlButton('skip-track', '체크 해제하고 넘기기', onSkipPlaying))
  }

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
