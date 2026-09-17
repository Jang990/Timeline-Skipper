import { createButton } from '../../elements.js'
import { createIcon } from '../../icons.js'

// 닫기는 취소와 같은 일을 하지만 이름은 따로 둔다. 둘 다 "취소"면 화면 낭독기에서 구별되지 않는다.
export function createSheetHeader(heading, onClose) {
  const handle = document.createElement('div')
  handle.className = 'timeline-skip-sheet-handle'
  handle.setAttribute('aria-hidden', 'true')

  const title = document.createElement('span')
  title.className = 'timeline-skip-sheet-heading'
  title.textContent = heading

  const close = createButton({
    label: '',
    className: 'timeline-skip-sheet-close',
    title: '닫기',
    ariaLabel: '닫기',
    onClick: onClose
  })
  close.append(createIcon('close'))

  const header = document.createElement('div')
  header.className = 'timeline-skip-sheet-header'
  header.append(title, close)

  const fragment = document.createDocumentFragment()
  fragment.append(handle, header)

  return fragment
}

// 저장은 채운 버튼으로 세워 시트에서 끝낼 곳이 한눈에 보이게 한다.
export function createSheetFooter(onCancel, onSubmit) {
  const footer = document.createElement('div')
  footer.className = 'timeline-skip-sheet-footer'
  footer.append(
    createButton({ label: '취소', className: 'timeline-skip-sheet-cancel', ariaLabel: '취소', onClick: onCancel }),
    createButton({ label: '저장', className: 'timeline-skip-sheet-save', ariaLabel: '저장', onClick: onSubmit })
  )

  return footer
}
