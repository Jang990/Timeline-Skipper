import { createButton } from '../elements.js'
import { createIcon } from '../icons.js'

// 위젯 카드의 가장자리 버튼들이다. 어느 것을 붙일지는 위젯이 떠 있는 자리에 따라 floating.js가 고른다.

export function createCollapseButton(onCollapse) {
  const button = createButton({
    label: '',
    className: 'timeline-skip-floating-collapse',
    title: '접기',
    ariaLabel: '플레이어 접기',
    onClick: onCollapse
  })
  button.append(createIcon('chevron-down'))

  return button
}

// 접기 버튼과 같은 모양으로 제목 줄 끝에 나란히 선다.
export function createPictureInPictureButton(onOpen) {
  const button = createButton({
    label: '',
    className: 'timeline-skip-floating-pip',
    title: 'PiP로 띄우기',
    ariaLabel: 'PiP로 띄우기',
    onClick: onOpen
  })
  button.append(createIcon('picture-in-picture'))

  return button
}
