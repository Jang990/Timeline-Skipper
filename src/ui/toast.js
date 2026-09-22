const TOAST_CLASS = 'timeline-skip-toast'
const TOAST_SHOW_MILLISECONDS = 2500

// 패널은 다시 그릴 때마다 속이 바뀐다. 그 안에 두면 알림이 도중에 사라지므로 페이지에 직접 붙인다.
// 새 알림이 오면 앞의 것은 바로 뗀다. 겹쳐 쌓이면 무엇이 최신인지 알 수 없다.
export function showToast(message) {
  document.querySelector(`.${TOAST_CLASS}`)?.remove()

  const toast = document.createElement('div')
  toast.className = TOAST_CLASS
  toast.setAttribute('role', 'status')
  toast.textContent = message
  document.body.append(toast)

  setTimeout(() => toast.remove(), TOAST_SHOW_MILLISECONDS)
}
