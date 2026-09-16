import { createButton } from '../elements.js'
import { createIcon } from '../icons.js'

const MORE_LABEL = '더보기'

// 여닫는 상태는 DOM에만 둔다. 패널을 다시 그리면 메뉴도 새로 만들어져 닫힌 채로 시작한다.
// 닫는 조건을 메뉴 안의 이벤트로만 잡는다. document에 걸면 헤더를 다시 그릴 때마다 떼어줘야 한다.
export function createHeaderMenu(items) {
  const root = document.createElement('div')
  root.className = 'timeline-skip-menu-root'

  const menu = document.createElement('div')
  menu.className = 'timeline-skip-menu'
  menu.setAttribute('role', 'menu')
  menu.hidden = true

  const toggle = createButton({
    label: '',
    className: 'timeline-skip-more',
    title: MORE_LABEL,
    ariaLabel: MORE_LABEL,
    onClick: () => setOpen(menu.hidden)
  })
  toggle.setAttribute('aria-haspopup', 'menu')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.append(createIcon('more'))

  const setOpen = (isOpen) => {
    menu.hidden = !isOpen
    toggle.setAttribute('aria-expanded', String(isOpen))

    // 키보드로 연 사람이 바로 항목을 고를 수 있게 첫 항목으로 옮긴다.
    if (isOpen) {
      menu.querySelector('button')?.focus()
    }
  }

  menu.append(...items.map((item) => createItem(item, () => setOpen(false))))
  root.append(toggle, menu)
  bindClosing(root, toggle, setOpen)

  return root
}

// 메뉴 밖을 누르면 초점이 메뉴 밖으로 나간다. 그 순간을 "밖을 눌렀다"로 읽는다.
function bindClosing(root, toggle, setOpen) {
  root.addEventListener('focusout', (event) => {
    if (!root.contains(event.relatedTarget)) {
      setOpen(false)
    }
  })

  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setOpen(false)
      toggle.focus()
    }
  })
}

// 동작이 목록을 다시 그리게 할 수 있다. 닫기를 먼저 해야 사라질 메뉴를 붙들고 있지 않는다.
function createItem({ label, onSelect, isDestructive = false }, close) {
  const item = createButton({
    label,
    className: isDestructive ? 'timeline-skip-menu-item is-destructive' : 'timeline-skip-menu-item',
    onClick: () => {
      close()
      onSelect()
    }
  })
  item.setAttribute('role', 'menuitem')

  return item
}
