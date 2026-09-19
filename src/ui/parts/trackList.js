import { createButton } from '../elements.js'
import { formatTimestamp } from '../formatTimestamp.js'
import { createIcon } from '../icons.js'

// 원본 댓글은 그대로 남아 언제든 다시 불러올 수 있다. 그래서 "삭제"가 아니라 "빼기"다.
// 항목을 빼면 그 구간은 앞 트랙에 합쳐진다. 첫 트랙만은 앞이 없어 트랙 밖 구간이 된다.
const REMOVE_HINT = '목록에서 빼기 — 이 구간은 앞 트랙에 합쳐집니다'
const REMOVE_HINT_FIRST = '목록에서 빼기 — 영상 시작 구간은 트랙 없이 재생됩니다'
const SKIPPED_LABEL = '건너뜀'
const EQUALIZER_BAR_COUNT = 3

// 고치는 트랙의 행은 편집 폼이 열려도 목록에 남겨 강조한다. 앞뒤 트랙과 함께 보여야 어디를 고치는지 안다.
export function createList(view) {
  const list = document.createElement('div')
  list.className = 'timeline-skip-list'
  list.append(...view.tracks.map((track, index) => createRow(track, view, index === 0)))

  return list
}

function createRow(track, view, isFirstTrack) {
  const { disabledStartSeconds, playingStartSeconds, editingStartSeconds, onToggle, onSeek, onDelete, onStartEdit } =
    view
  const isDisabled = disabledStartSeconds.has(track.startSeconds)
  const isPlaying = track.startSeconds === playingStartSeconds
  const row = createRowShell(isDisabled, isPlaying)
  row.classList.toggle('is-edit-target', track.startSeconds === editingStartSeconds)

  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  checkbox.checked = !isDisabled
  checkbox.setAttribute('aria-label', `${track.title} 재생`)
  checkbox.addEventListener('change', () => onToggle(track.startSeconds))

  const time = createButton({
    label: toTimeLabel(track),
    className: 'timeline-skip-time',
    onClick: () => onSeek(track.startSeconds)
  })

  // 댓글 본문은 남이 쓴 문자열이다. 항상 textContent로만 넣는다.
  const title = document.createElement('span')
  title.className = 'timeline-skip-title'
  title.textContent = track.title

  row.append(
    checkbox,
    time,
    title,
    ...createStatusMarks(isDisabled, isPlaying),
    createRowButton('edit', `${track.title} 수정`, '시각과 제목 수정', () => onStartEdit(track.startSeconds)),
    createRowButton(
      'remove',
      `${track.title} 목록에서 빼기`,
      isFirstTrack ? REMOVE_HINT_FIRST : REMOVE_HINT,
      () => onDelete(track.startSeconds),
      'timeline-skip-remove'
    )
  )

  return row
}

// 해제된 트랙을 지나는 중이면 두 상태가 겹친다. 하나가 다른 하나를 지우지 않도록 클래스로 따로 얹는다.
function createRowShell(isDisabled, isPlaying) {
  const row = document.createElement('div')
  row.className = 'timeline-skip-row'
  row.classList.toggle('is-disabled', isDisabled)
  row.classList.toggle('is-playing', isPlaying)

  // 색만으로는 화면을 읽어주는 사람에게 아무것도 전해지지 않는다.
  if (isPlaying) {
    row.setAttribute('aria-current', 'true')
  }

  return row
}

// 흐림과 취소선만으로는 "꺼 둔 것"인지 "지난 것"인지 갈리지 않는다. 글로 한 번 더 적는다.
// 재생 중 표시는 aria-current가 이미 읽어준다. 그림은 눈으로만 본다.
function createStatusMarks(isDisabled, isPlaying) {
  const marks = []

  if (isDisabled) {
    const badge = document.createElement('span')
    badge.className = 'timeline-skip-skipped-badge'
    badge.textContent = SKIPPED_LABEL
    marks.push(badge)
  }

  if (isPlaying) {
    const equalizer = document.createElement('span')
    equalizer.className = 'timeline-skip-equalizer'
    equalizer.setAttribute('aria-hidden', 'true')
    equalizer.append(...Array.from({ length: EQUALIZER_BAR_COUNT }, () => document.createElement('span')))
    marks.push(equalizer)
  }

  return marks
}

// 주 기능은 체크박스다. 수정과 빼기는 평소 숨겨두고 hover나 키보드 포커스에서만 드러낸다.
// ✕는 파괴적인 삭제로 읽힌다. 목록에서 빼는 동작이므로 −를 쓴다(추가의 +와 짝).
// 오클릭을 막으려고 체크박스 반대쪽 끝에 둔다.
function createRowButton(iconName, ariaLabel, hint, onClick, extraClass = '') {
  const button = createButton({
    label: '',
    className: `timeline-skip-row-action ${extraClass}`.trim(),
    title: hint,
    ariaLabel,
    onClick
  })
  button.append(createIcon(iconName))

  return button
}

// 당겨둔 끝이 있을 때만 구간으로 보여준다. 전부 범위로 쓰면 손대지 않은 트랙까지
// 끝을 정해둔 것처럼 보이고, 목록을 눈으로 훑기도 어려워진다.
function toTimeLabel(track) {
  if (track.trimmedEndSeconds === null) {
    return formatTimestamp(track.startSeconds)
  }

  return `${formatTimestamp(track.startSeconds)} ~ ${formatTimestamp(track.trimmedEndSeconds)}`
}
