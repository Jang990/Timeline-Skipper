// 화면 곳곳에서 버튼과 입력칸을 만든다. 세우는 방식은 같고 붙이는 값만 다르다.
// 각 파트는 자기 어휘로 얇게 감싸 쓰고, 여기서는 공통 뼈대만 만든다.

// title은 hover 툴팁, ariaLabel은 화면 낭독기용이다. 기호만 있는 버튼은 둘 다 필요하다.
export function createButton({ label, className, title, ariaLabel, isDisabled = false, onClick }) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = className
  button.textContent = label
  button.disabled = isDisabled

  if (title !== undefined) {
    button.title = title
  }

  if (ariaLabel !== undefined) {
    button.setAttribute('aria-label', ariaLabel)
  }

  button.addEventListener('click', onClick)

  return button
}

export function createInput({ className, value }) {
  const input = document.createElement('input')
  input.type = 'text'
  input.className = className
  input.value = value

  return input
}
