// 시각 칸 하나와 그 옆에 서는 것들. 이름표가 칸 위에 붙어 있어 버튼 글자는 짧게 둘 수 있다.
// 무엇을 옆에 세울지는 부르는 쪽이 정한다. 버튼끼리 묶이기도 하고 칸막이가 끼기도 한다.
export function createTimeFieldCard(fieldName, input, controls) {
  const label = document.createElement('span')
  label.className = 'timeline-skip-step-label'
  label.textContent = fieldName

  const field = document.createElement('div')
  field.className = 'timeline-skip-step-field'
  field.append(label, input)

  const card = document.createElement('div')
  card.className = 'timeline-skip-step-row'
  card.append(field, ...controls)

  return card
}
