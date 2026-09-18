const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

// 색은 currentColor라 버튼의 글자색을 따라간다. 재생 조작은 유튜브 플레이어처럼 면을 채우고,
// 나머지는 선으로 그린다.
const LINE_ICONS = {
  edit: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  remove: ['M5 12h14'],
  add: ['M12 5v14', 'M5 12h14'],
  close: ['M18 6L6 18', 'M6 6l12 12'],
  'chevron-down': ['M6 9l6 6 6-6'],
  'chevron-up': ['M18 15l-6-6-6 6'],
  'picture-in-picture': ['M21 11V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h7', 'M14 14h7v5h-7z'],
  repeat: ['M17 2l4 4-4 4', 'M3 11V9a3 3 0 0 1 3-3h15', 'M7 22l-4-4 4-4', 'M21 13v2a3 3 0 0 1-3 3H3']
}

const FILLED_ICONS = {
  previous: ['M6 6h2v12H6z', 'M9.5 12L18 18V6z'],
  play: ['M8 5v14l11-7z'],
  pause: ['M7 5h3.5v14H7z', 'M13.5 5H17v14h-3.5z'],
  next: ['M16 6h2v12h-2z', 'M6 18l8.5-6L6 6z'],
  more: [
    'M10.2 5a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0',
    'M10.2 12a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0',
    'M10.2 19a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0'
  ]
}

const LINE_STYLE = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
}

const FILLED_STYLE = { fill: 'currentColor' }

const EQUALIZER_BAR_COUNT = 3

// 이름은 버튼의 aria-label이 읽힌다. 아이콘까지 읽히면 같은 말이 두 번 나온다.
// data-icon은 재생과 일시정지처럼 이름표가 아니라 모양으로만 갈리는 상태를 밖에서 읽게 한다.
export function createIcon(name) {
  const isFilled = name in FILLED_ICONS
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.dataset.icon = name
  svg.classList.add('timeline-skip-icon')

  for (const [attribute, value] of Object.entries(isFilled ? FILLED_STYLE : LINE_STYLE)) {
    svg.setAttribute(attribute, value)
  }

  for (const pathData of isFilled ? FILLED_ICONS[name] : LINE_ICONS[name]) {
    const path = document.createElementNS(SVG_NAMESPACE, 'path')
    path.setAttribute('d', pathData)
    svg.append(path)
  }

  return svg
}

// 재생 중이라는 표시다. 모양은 목록 행의 막대 그림과 같은 클래스로 맞춘다.
export function createEqualizerIcon() {
  const equalizer = document.createElement('span')
  equalizer.className = 'timeline-skip-equalizer'
  equalizer.setAttribute('aria-hidden', 'true')
  equalizer.append(...Array.from({ length: EQUALIZER_BAR_COUNT }, () => document.createElement('span')))

  return equalizer
}
