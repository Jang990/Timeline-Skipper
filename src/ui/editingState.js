// 편집·추가 중인 행은 저장할 값이 아니라 화면만의 상태다. core도 content도 알 필요가 없다.
// 다시 그리는 일은 여기서 하지 않는다. 상태만 바꾸고, 그리는 시점은 panel이 정한다.
// 그래야 이 파일이 DOM 없이 테스트된다.
export function createEditingState() {
  let editingStartSeconds = null
  let addingDraftSeconds = null
  const following = createFollowing()

  // 무엇을 열고 닫든 따라가기는 함께 꺼진다. 끝 칸이 바뀐 뒤에도 재생 위치를 받으면 엉뚱한 칸에 쓴다.
  const open = (nextEditingStartSeconds, nextAddingDraftSeconds) => {
    editingStartSeconds = nextEditingStartSeconds
    addingDraftSeconds = nextAddingDraftSeconds
    following.stop()
  }
  const isEditing = () => editingStartSeconds !== null || addingDraftSeconds !== null

  return {
    isEditing,
    toKey: () => `${editingStartSeconds}#${addingDraftSeconds}`,
    getEditingStartSeconds: () => editingStartSeconds,
    getAddingDraftSeconds: () => addingDraftSeconds,

    // 수정과 추가는 동시에 열리지 않는다. 한쪽을 열면 다른 쪽은 닫힌다.
    startEditing: (startSeconds) => open(startSeconds, null),

    // 재생 준비 전이나 라이브에서는 재생 위치가 NaN이다. 그때는 0초에서 시작한다.
    startAdding: (currentTimeSeconds) =>
      open(null, Number.isFinite(currentTimeSeconds) ? Math.floor(currentTimeSeconds) : 0),

    // 사용자가 취소한 경우와 영상이 바뀐 경우는 부르는 쪽의 사정만 다르고 결과는 같다.
    cancel: () => open(null, null),
    reset: () => open(null, null),

    // 확정은 자기가 연 쪽만 닫는다. 취소와 달리 반대쪽을 건드릴 이유가 없다.
    finishEdit: () => open(null, addingDraftSeconds),
    finishAdd: () => open(editingStartSeconds, null),

    // 따라가기는 열린 편집 행의 끝 칸에 붙는다. 열린 행이 없으면 켤 곳이 없다.
    startFollowing(onFollow) {
      if (isEditing()) {
        following.start(onFollow)
      }
    },
    stopFollowing: following.stop,
    isFollowing: following.isOn,
    followPlayback: following.observe
  }
}

// 끝 칸이 재생 위치를 따라가는 동안의 상태. 편집이 닫힐 때 함께 꺼지도록 편집 상태 안에 둔다.
function createFollowing() {
  let onFollow = null
  let wasPlaying = false

  const stop = () => {
    onFollow = null
    wasPlaying = false
  }

  return {
    isOn: () => onFollow !== null,
    stop,

    start(handler) {
      onFollow = handler
      wasPlaying = false
    },

    // 재생 중이던 영상이 멈추는 순간이 끝이다. 멈춘 채로 켰다면 재생되기를 기다린다.
    // 꺼지는 순간의 위치도 넘겨야 끝 칸에 멈춘 시각이 남는다.
    observe({ currentTimeSeconds, isPaused }) {
      if (onFollow === null) {
        return
      }

      const handler = onFollow
      const hasStopped = wasPlaying && isPaused
      wasPlaying = !isPaused

      if (hasStopped) {
        stop()
      }

      handler({ currentTimeSeconds, isFollowing: !hasStopped })
    }
  }
}
