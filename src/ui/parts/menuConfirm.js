import { createButton } from '../elements.js'

const CANCEL_LABEL = '취소'

// 되돌릴 수 없는 동작을 고른 뒤 메뉴 자리에 띄우는 경고다.
export function createMenuConfirm({ title, detail, confirmLabel, onConfirm, onCancel }) {
  const confirm = document.createElement('div')
  confirm.className = 'timeline-skip-menu-confirm'
  confirm.setAttribute('role', 'alertdialog')

  const heading = document.createElement('p')
  heading.className = 'timeline-skip-menu-confirm-title'
  heading.textContent = title

  const description = document.createElement('p')
  description.className = 'timeline-skip-menu-confirm-detail'
  description.textContent = detail

  const buttons = document.createElement('div')
  buttons.className = 'timeline-skip-menu-confirm-buttons'
  buttons.append(
    createButton({ label: CANCEL_LABEL, className: 'timeline-skip-menu-confirm-cancel', onClick: onCancel }),
    createButton({ label: confirmLabel, className: 'timeline-skip-menu-confirm-accept', onClick: onConfirm })
  )

  confirm.append(heading, description, buttons)

  return confirm
}
