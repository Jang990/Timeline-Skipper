// 편집·추가 중인 행은 저장할 값이 아니라 화면만의 상태다. core도 content도 알 필요가 없다.
// 다시 그리는 일은 여기서 하지 않는다. 상태만 바꾸고, 그리는 시점은 panel이 정한다.
// 그래야 이 파일이 DOM 없이 테스트된다.
export function createEditingState() {
  let editingStartSeconds = null
  let addingDraftSeconds = null

  // 사용자가 취소한 경우와 영상이 바뀐 경우는 부르는 쪽의 사정만 다르고 결과는 같다.
  const closeAll = () => {
    editingStartSeconds = null
    addingDraftSeconds = null
  }

  return {
    isEditing: () => editingStartSeconds !== null || addingDraftSeconds !== null,
    toKey: () => `${editingStartSeconds}#${addingDraftSeconds}`,
    getEditingStartSeconds: () => editingStartSeconds,
    getAddingDraftSeconds: () => addingDraftSeconds,

    // 수정과 추가는 동시에 열리지 않는다. 한쪽을 열면 다른 쪽은 닫힌다.
    startEditing(startSeconds) {
      editingStartSeconds = startSeconds
      addingDraftSeconds = null
    },

    // 재생 준비 전이나 라이브에서는 재생 위치가 NaN이다. 그때는 0초에서 시작한다.
    startAdding(currentTimeSeconds) {
      addingDraftSeconds = Number.isFinite(currentTimeSeconds) ? Math.floor(currentTimeSeconds) : 0
      editingStartSeconds = null
    },

    cancel: closeAll,
    reset: closeAll,

    // 확정은 자기가 연 쪽만 닫는다. 취소와 달리 반대쪽을 건드릴 이유가 없다.
    finishEdit() {
      editingStartSeconds = null
    },

    finishAdd() {
      addingDraftSeconds = null
    }
  }
}
