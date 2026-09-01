import { createButton } from './elements.js'
import { createEditRow } from './trackEditRow.js'
import { formatTimestamp } from './formatTimestamp.js'

// 원본 댓글은 그대로 남아 언제든 다시 불러올 수 있다. 그래서 "삭제"가 아니라 "빼기"다.
// 항목을 빼면 그 구간은 앞 트랙에 합쳐진다. 첫 트랙만은 앞이 없어 트랙 밖 구간이 된다.
const REMOVE_HINT = '목록에서 빼기 — 이 구간은 앞 트랙에 합쳐집니다'
const REMOVE_HINT_FIRST = '목록에서 빼기 — 영상 시작 구간은 트랙 없이 재생됩니다'

export function createList(view) {
  const list = document.createElement('div')
  list.className = 'timeline-skip-list'
  list.append(
    ...view.tracks.map((track, index) =>
      track.startSeconds === view.editingStartSeconds
        ? createEditRow({ ...track, previousStartSeconds: track.startSeconds }, view)
        : createRow(track, view, index === 0)
    )
  )

  return list
}

function createRow(track, { disabledStartSeconds, onToggle, onSeek, onDelete, onStartEdit }, isFirstTrack) {
  const isDisabled = disabledStartSeconds.has(track.startSeconds)

  const row = document.createElement('div')
  row.className = isDisabled ? 'timeline-skip-row is-disabled' : 'timeline-skip-row'

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = !isDisabled
  checkbox.setAttribute('aria-label', `${track.title} 재생`)
  checkbox.addEventListener('change', () => onToggle(track.startSeconds))

  const time = document.createElement('button')
  time.type = 'button'
  time.className = 'timeline-skip-time'
  time.textContent = formatTimestamp(track.startSeconds)
  time.addEventListener('click', () => onSeek(track.startSeconds))

  // 댓글 본문은 남이 쓴 문자열이다. 항상 textContent로만 넣는다.
  const title = document.createElement('span')
  title.className = 'timeline-skip-title'
  title.textContent = track.title

  row.append(
    checkbox,
    time,
    title,
    createRowButton('✎', `${track.title} 수정`, '시각과 제목 수정', () => onStartEdit(track.startSeconds)),
    createRowButton(
      '−',
      `${track.title} 목록에서 빼기`,
      isFirstTrack ? REMOVE_HINT_FIRST : REMOVE_HINT,
      () => onDelete(track.startSeconds),
      'timeline-skip-remove'
    )
  )

  return row
}

// 주 기능은 체크박스다. 수정과 빼기는 평소 숨겨두고 hover나 키보드 포커스에서만 드러낸다.
// ✕는 파괴적인 삭제로 읽힌다. 목록에서 빼는 동작이므로 −를 쓴다(추가의 +와 짝).
// 오클릭을 막으려고 체크박스 반대쪽 끝에 둔다.
function createRowButton(symbol, ariaLabel, hint, onClick, extraClass = '') {
  return createButton({
    label: symbol,
    className: `timeline-skip-row-action ${extraClass}`.trim(),
    title: hint,
    ariaLabel,
    onClick
  })
}

// 목록이 비어 있어도 보여야 한다. 댓글 없이 직접 만들어 쓰는 사람도 있다.
export function createAddRow(onStartAdd) {
  const row = document.createElement('div')
  row.className = 'timeline-skip-add-row'

  row.append(
    createButton({
      label: '+ 직접 추가',
      className: 'timeline-skip-add',
      title: '지금 재생 위치로 트랙을 추가합니다',
      onClick: onStartAdd
    })
  )

  return row
}
