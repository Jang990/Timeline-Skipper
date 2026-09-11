import { createButton } from '../elements.js'

const FOLLOW_HINT = '영상을 멈추면 그 시각이 끝이 됩니다. 따라가는 동안에는 건너뛰기와 반복이 멈춥니다.'

// 끝 칸이 재생 위치를 따라가게 하는 ⏺와 그 안내 문구. 켜짐 여부는 편집 상태가 쥐고, 여기서는 보여주기만 한다.
// 켜야만 따라간다. 늘 따라가면 제목만 고치러 연 사이 재생 중인 끝 칸이 조용히 바뀌어 저장된다.
export function createFollowButton({ following, getCurrentTimeSeconds, onFollow }) {
  const hint = document.createElement('div')
  hint.className = 'timeline-skip-follow-hint'
  hint.textContent = FOLLOW_HINT

  const button = createButton({
    label: '⏺',
    className: 'timeline-skip-step timeline-skip-follow',
    title: '끝 칸이 재생 위치를 따라갑니다',
    ariaLabel: '끝 따라가기',
    onClick: () => (following.isFollowing() ? stop() : start())
  })

  // 건너뛰기가 왜 멈췄는지는 이 표시만이 말해 준다. 켜짐과 꺼짐이 어긋나면 안 된다.
  const show = (isFollowing) => {
    button.classList.toggle('is-following', isFollowing)
    button.setAttribute('aria-pressed', String(isFollowing))
    hint.hidden = !isFollowing
  }

  const stop = () => {
    following.stopFollowing()
    show(false)
  }

  // 켜는 순간의 재생 위치부터 넣는다. 멈춘 채로 켜도 무엇을 따라가는지 칸에 보여야 한다.
  const start = () => {
    following.startFollowing(({ currentTimeSeconds, isFollowing }) => {
      onFollow(currentTimeSeconds)
      show(isFollowing)
    })
    onFollow(getCurrentTimeSeconds())
    show(true)
  }

  show(false)

  return { button, hint, stop }
}
