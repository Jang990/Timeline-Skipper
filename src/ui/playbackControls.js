import { createButton } from './elements.js'

export function createControls({ isPaused, loopEnabled, onPrevious, onTogglePlay, onNext, onToggleLoop }) {
  const controls = document.createElement('div')
  controls.className = 'timeline-skip-controls'

  controls.append(
    createControlButton('⏮', '이전 트랙', onPrevious),
    createControlButton(isPaused ? '▶' : '⏸', isPaused ? '재생' : '일시정지', onTogglePlay),
    createControlButton('⏭', '다음 트랙', onNext),
    createControlButton('🔁', loopEnabled ? '반복 끄기' : '반복 켜기', onToggleLoop, loopEnabled)
  )

  return controls
}

function createControlButton(symbol, label, onClick, isActive = false) {
  return createButton({
    label: symbol,
    className: isActive ? 'timeline-skip-control is-active' : 'timeline-skip-control',
    title: label,
    ariaLabel: label,
    onClick
  })
}
