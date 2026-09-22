// 편집 시트와 한 줄 추가 칸이 부르는 일. 전부 편집 상태를 바꾸고 다시 그리거나, 저장을 넘기기만 한다.
// 무엇이 열리고 닫히는지는 editingState가 안다. 지금 화면의 값과 다시 그리는 방법은 panel이 넘긴다.
export function createEditingHandlers(editing, { getView, redraw, markArrival }) {
  return {
    onStartEdit: (startSeconds) => {
      editing.startEditing(startSeconds)
      redraw()
    },

    // 편집이든 추가든 취소는 하나다. 열려 있던 입력을 닫고 원래 목록으로 돌아간다.
    onCancelEdit: () => {
      editing.cancel()
      redraw()
    },

    // 편집을 먼저 닫아야 이어지는 그리기가 억제되지 않는다.
    // 고친 행은 목록의 다른 자리로 갈 수 있다. 어디로 갔는지 보여주고 끝낸다.
    onSubmitEdit: (previousStartSeconds, entry) => {
      editing.finishEdit()
      markArrival(entry.timestampSeconds)
      getView().onEdit(previousStartSeconds, entry)
    },

    // 시트는 한 줄 칸에서 넘어온다. 시트로 저장했으면 칸에 남은 글자는 이미 쓰인 것이다.
    onSubmitAdd: (entry) => {
      editing.finishAdd()
      editing.setQuickAddText('')
      markArrival(entry.timestampSeconds)
      getView().onAdd(entry)
    },

    onQuickTextChange: editing.setQuickAddText,

    // 미리보기용 표시(usesNow)는 저장하지 않는다. 저장분에는 시트로 넣은 항목과 같은 값만 남긴다.
    // 댓글을 통째로 붙여넣으면 한 번에 여럿이 들어가고, 하나 들어갈 때마다 목록을 다시 그린다.
    // 앞선 그리기에 붙인 도착 표시는 다음 그리기가 지우므로, 마지막 그리기에서만 자리를 찍는다.
    // 보여줄 자리는 첫 줄이다. 붙여넣은 덩어리가 어디서 시작하는지가 사람이 찾는 것이다.
    onQuickAdd: (entries) => {
      editing.setQuickAddText('')

      entries.forEach(({ timestampSeconds, title, isDisabled }, index) => {
        if (index === entries.length - 1) {
          markArrival(entries[0].timestampSeconds)
        }

        getView().onAdd({ timestampSeconds, title, isDisabled })
      })
    },

    // 칸이 비어 있으면 듣던 자리에서, 읽은 줄이 있으면 그 시각과 제목을 채워 시트를 연다.
    onOpenDetailedAdd: (entry) => {
      if (entry === null) {
        editing.startAdding(getView().getCurrentTimeSeconds())
      } else {
        editing.startAdding(entry.timestampSeconds, entry.title)
      }

      redraw()
    }
  }
}
