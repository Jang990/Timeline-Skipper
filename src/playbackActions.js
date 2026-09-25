// ⏮·⏭ 버튼의 동작이다. 어디로 갈지는 core가 정하고, 여기서는 그 결과를 플레이어에 건다.
// context는 { state, modules }이다. 상태를 숨기지 않고 인자로 받는다.
export function createPlaybackActions(context) {
  return {
    goToPrevious: () => goToPrevious(context),
    goToNext: () => goToNext(context)
  }
}

function goToPrevious({ state, modules }) {
  const { previous, player } = modules
  const targetSeconds = previous.findPreviousTrackTarget(state, player.getCurrentTimeSeconds())

  if (targetSeconds !== null) {
    player.seekTo(targetSeconds)
  }
}

function goToNext({ state, modules }) {
  const { next, player } = modules
  const target = next.findNextTrackTarget(state, player.getCurrentTimeSeconds())

  if (target === null) {
    return
  }

  if (target.shouldPause) {
    player.seekAndPause(target.targetSeconds)
  } else {
    player.seekTo(target.targetSeconds)
  }
}
