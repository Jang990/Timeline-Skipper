const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

// 선으로 그리는 아이콘만 둔다. 색은 currentColor라 버튼의 글자색을 따라간다.
const ICON_PATHS = {
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  remove: ['M5 12h14'],
  add: ['M12 5v14', 'M5 12h14']
}

// 이름은 버튼의 aria-label이 읽힌다. 아이콘까지 읽히면 같은 말이 두 번 나온다.
export function createIcon(name) {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('timeline-skip-icon')

  for (const pathData of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NAMESPACE, 'path')
    path.setAttribute('d', pathData)
    svg.append(path)
  }

  return svg
}
