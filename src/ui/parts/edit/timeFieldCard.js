import { createButton } from '../../elements.js'

// 시작·끝 칸 하나. 이름표가 칸 위에 붙어 있어 버튼 글자는 "지금"만으로 뜻이 선다.
// 읽어 주는 이름은 이름표를 보지 못하는 사람을 위해 어느 칸인지까지 말한다.
export function createTimeFieldCard(fieldName, input, onCapture) {
  const label = document.createElement('span')
  label.className = 'timeline-skip-step-label'
  label.textContent = fieldName

  const field = document.createElement('div')
  field.className = 'timeline-skip-step-field'
  field.append(label, input)

  const card = document.createElement('div')
  card.className = 'timeline-skip-step-row'
  card.append(
    field,
    createButton({
      label: '지금',
      className: 'timeline-skip-step is-capture',
      title: `${fieldName}을 지금 재생 위치로`,
      ariaLabel: `${fieldName}을 지금 위치로`,
      onClick: onCapture
    })
  )

  return card
}
