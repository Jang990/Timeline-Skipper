import { createButton } from '../elements.js'
import { createIcon } from '../icons.js'
import { createMenuConfirm } from './menuConfirm.js'

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

  // 경고는 메뉴가 열린 동안에만 있다. 닫을 때 함께 떼어야 다시 열 때 항목이 보인다.
  const setOpen = (isOpen) => {
    menu.hidden = !isOpen
    toggle.setAttribute('aria-expanded', String(isOpen))
    removeConfirm(root, toggle)

    // 키보드로 연 사람이 바로 항목을 고를 수 있게 첫 항목으로 옮긴다.
    if (isOpen) {
      menu.querySelector('button')?.focus()
    }
  }

  const close = () => setOpen(false)

  menu.append(...items.map((item) => createItem(item, () => pick(item, { root, menu, close }))))
  root.append(toggle, menu)
  bindClosing(root, toggle, setOpen)

  return root
}

// 경고가 붙은 항목은 바로 실행하지 않고 메뉴 자리에 경고를 띄운다.
function pick(item, menuParts) {
  if (item.confirmation) {
    showConfirm(item, menuParts)

    return
  }

  select(item, menuParts.close)
}

function showConfirm(item, { root, menu, close }) {
  root.append(createMenuConfirm({ ...item.confirmation, onConfirm: () => select(item, close), onCancel: close }))

  // 누른 항목이 숨겨지면 초점이 갈 곳을 잃고 focusout이 경고까지 닫는다. 숨기기 전에 옮겨 둔다.
  // 옮길 곳은 취소다. Enter를 한 번 더 눌러도 지워지지 않아야 한다.
  root.querySelector('.timeline-skip-menu-confirm-cancel').focus()
  menu.hidden = true
}

// 크롬은 초점을 가진 요소를 떼는 도중에 focusout을 보낸다. 그 처리가 같은 경고를 또 떼려다 멈춘다.
// 초점을 더보기 버튼으로 먼저 돌려 둔다. 키보드로 쓰던 사람도 제자리로 돌아온다.
function removeConfirm(root, toggle) {
  const confirm = root.querySelector('[role="alertdialog"]')

  if (confirm?.contains(document.activeElement)) {
    toggle.focus()
  }

  confirm?.remove()
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
function select({ onSelect }, close) {
  close()
  onSelect()
}

function createItem({ label, isDestructive = false }, onClick) {
  const item = createButton({
    label,
    className: isDestructive ? 'timeline-skip-menu-item is-destructive' : 'timeline-skip-menu-item',
    onClick
  })
  item.setAttribute('role', 'menuitem')

  return item
}
