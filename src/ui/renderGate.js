// 페이지가 조금만 바뀌어도 다시 그리라는 요청이 온다.
// 내용이 그대로면 건너뛰어야 체크박스가 깜빡이지 않는다.
// 판단만 하고 그리지는 않는다. 그래서 이 파일은 DOM 없이 테스트된다.
export function createRenderGate() {
  let lastSignature = null
  let lastRenderedEditKey = null

  return {
    // 'draw' 그린다 · 'playback' 바 위의 재생 위치만 넘긴다 · 'skip' 아무것도 하지 않는다
    decide({ hasPanel, view, editKey, isEditing }) {
      // 편집 중에 다시 그리면 입력하던 글자가 사라진다. 편집 대상이 바뀔 때만 그린다.
      // 그리지 않는 동안에도 바 위의 재생 위치는 움직여야 하므로 위치만 넘긴다.
      if (hasPanel && isEditing && editKey === lastRenderedEditKey) {
        return 'playback'
      }

      const signature = `${toSignature(view)}#${editKey}`

      if (hasPanel && signature === lastSignature) {
        return 'skip'
      }

      lastSignature = signature
      lastRenderedEditKey = editKey

      return 'draw'
    },

    forgetEditKey() {
      lastRenderedEditKey = null
    }
  }
}

function toSignature({ tracks, disabledStartSeconds, isPaused, loopEnabled, playingStartSeconds, floatingHidden }) {
  const trackPart = tracks.map((track) => `${track.startSeconds}:${track.trimmedEndSeconds}:${track.title}`).join('|')

  return `${trackPart}#${[...disabledStartSeconds].join(',')}#${isPaused}#${loopEnabled}#${playingStartSeconds}#${floatingHidden}`
}
