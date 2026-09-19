// 편집·추가 중인 행은 저장할 값이 아니라 화면만의 상태다. core도 content도 알 필요가 없다.
// 다시 그리는 일은 여기서 하지 않는다. 상태만 바꾸고, 그리는 시점은 panel이 정한다.
// 그래야 이 파일이 DOM 없이 테스트된다.
export function createEditingState() {
  let editingStartSeconds = null
  let addingDraftSeconds = null
  let addingDraftTitle = ''

  // 한 줄 입력칸의 글자. 재생 중에 패널이 다시 그려져도 치던 글자가 남아야 한다.
  let quickAddText = ''

  // 열린 편집 행의 바가 재생 위치를 받는 곳. 편집 중에는 panel이 다시 그리지 않아서 이 길로만 위치가 간다.
  let playbackListener = null

  const isEditing = () => editingStartSeconds !== null || addingDraftSeconds !== null

  // 무엇을 열고 닫든 받는 곳은 지운다. 남겨두면 화면에서 이미 사라진 바에 위치를 계속 쓴다.
  const open = (nextEditingStartSeconds, nextAddingDraftSeconds, nextAddingDraftTitle = '') => {
    editingStartSeconds = nextEditingStartSeconds
    addingDraftSeconds = nextAddingDraftSeconds
    addingDraftTitle = nextAddingDraftTitle
    playbackListener = null
  }

  return {
    isEditing,
    toKey: () => `${editingStartSeconds}#${addingDraftSeconds}`,
    getEditingStartSeconds: () => editingStartSeconds,
    getAddingDraftSeconds: () => addingDraftSeconds,
    getAddingDraftTitle: () => addingDraftTitle,
    getQuickAddText: () => quickAddText,
    setQuickAddText: (text) => {
      quickAddText = text
    },

    // 수정과 추가는 동시에 열리지 않는다. 한쪽을 열면 다른 쪽은 닫힌다.
    startEditing: (startSeconds) => open(startSeconds, null),

    // 재생 준비 전이나 라이브에서는 재생 위치가 NaN이다. 그때는 0초에서 시작한다.
    startAdding: (currentTimeSeconds, title = '') =>
      open(null, Number.isFinite(currentTimeSeconds) ? Math.floor(currentTimeSeconds) : 0, title),

    // 사용자가 취소한 경우와 영상이 바뀐 경우는 부르는 쪽의 사정만 다르고 결과는 같다.
    cancel: () => open(null, null),
    reset: () => open(null, null),

    // 확정은 자기가 연 쪽만 닫는다. 취소와 달리 반대쪽을 건드릴 이유가 없다.
    finishEdit: () => open(null, addingDraftSeconds),
    finishAdd: () => open(editingStartSeconds, null),

    // 열린 행이 없으면 받을 바도 없다. 먼저 등록해 둔 것이 나중에 연 행의 위치를 받으면 안 된다.
    watchPlayback(listener) {
      if (isEditing()) {
        playbackListener = listener
      }
    },

    notifyPlayback(currentTimeSeconds) {
      playbackListener?.(currentTimeSeconds)
    }
  }
}
