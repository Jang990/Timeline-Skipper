// 목록을 바꾸는 동작을 한곳에 모았다. 전부 state를 고치고 commit(저장 + 다시 그리기)으로 끝난다.
// context는 { state, modules, commit }이다. 상태를 숨기지 않고 인자로 받는다.
export function createTrackActions(context) {
  return {
    addSource: (commentText) => addSource(context, commentText),
    clearEntries: () => clearEntries(context),
    toggleTrack: (startSeconds) => toggleTrack(context, startSeconds),
    toggleLoop: () => toggleLoop(context),
    setAllTracks: (isEnabled) => setAllTracks(context, isEnabled),
    deleteTrack: (startSeconds) => deleteTrack(context, startSeconds),
    editTrack: (startSeconds, entry) => editTrack(context, startSeconds, entry),
    addTrack: (entry) => addTrack(context, entry)
  }
}

function addSource({ state, modules, commit }, commentText) {
  state.entries.push(...modules.parser.parseTimelineComment(commentText))
  commit()
}

// 비우기는 목록과 체크 상태만 지운다. 불러오기 버튼은 다시 누를 수 있게 되돌린다.
function clearEntries({ state, modules, commit }) {
  state.entries = []
  state.disabledStartSeconds.clear()
  modules.comments.resetLoadButtons()
  commit()
}

function toggleTrack({ state, commit }, startSeconds) {
  if (state.disabledStartSeconds.has(startSeconds)) {
    state.disabledStartSeconds.delete(startSeconds)
  } else {
    state.disabledStartSeconds.add(startSeconds)
  }

  commit()
}

function toggleLoop({ state, commit }) {
  state.loopEnabled = !state.loopEnabled
  commit()
}

function setAllTracks({ state, modules, commit }, isEnabled) {
  state.disabledStartSeconds = modules.bulk.setAllTracksEnabled(state.tracks, isEnabled)
  commit()
}

function deleteTrack(context, startSeconds) {
  const nextEntries = context.modules.remover.removeEntriesAt(context.state.entries, startSeconds)

  applyEntryChange(context, nextEntries, startSeconds, null)
}

function editTrack(context, startSeconds, entry) {
  const nextEntries = context.modules.upserter.upsertEntry(context.state.entries, startSeconds, entry)

  applyEntryChange(context, nextEntries, startSeconds, entry.timestampSeconds)
}

function addTrack(context, entry) {
  const nextEntries = context.modules.upserter.upsertEntry(context.state.entries, null, entry)

  applyEntryChange(context, nextEntries, null, entry.timestampSeconds)
}

// 빼기·수정·추가가 모두 같은 순서를 따른다: 항목 갱신 → 체크 상태 이동 → 저장 → 그리기.
function applyEntryChange({ state, modules, commit }, nextEntries, fromSeconds, toSeconds) {
  state.entries = nextEntries
  state.disabledStartSeconds = modules.flagMover.moveDisabledFlag(state.disabledStartSeconds, fromSeconds, toSeconds)
  commit()
}
