import { createTrackActions } from './trackActions.js'

// core / adapters / ui를 연결한다. 계산은 core에, DOM은 adapters와 ui에 있다.
export function start(modules) {
  const { builder, player, storage, panel } = modules

  const state = {
    videoId: null,
    entries: [],
    disabledStartSeconds: new Set(),
    loopEnabled: false,
    tracks: []
  }

  const draw = () => {
    state.tracks = builder.buildTracks(state.entries, player.getDurationSeconds())
    panel.render(toPanelView(modules, state, actions))
  }

  // 저장과 그리기는 항상 함께 일어난다. 동작들은 이 하나만 알면 된다.
  const commit = () => {
    storage.writeVideoState(state.videoId, state)
    draw()
  }

  const actions = createTrackActions({ state, modules, commit })

  bindPage(modules, state, actions, draw)
  bindPlayback(modules, state, draw)
}

function toPanelView(modules, state, actions) {
  const { player, playing } = modules

  return {
    tracks: state.tracks,
    disabledStartSeconds: state.disabledStartSeconds,
    loopEnabled: state.loopEnabled,
    playingStartSeconds: playing.findPlayingStartSeconds(state.tracks, player.getCurrentTimeSeconds()),
    isPaused: player.isPaused(),
    getCurrentTimeSeconds: player.getCurrentTimeSeconds,
    onSeek: player.seekTo,
    onTogglePlay: player.togglePlay,
    onToggle: actions.toggleTrack,
    onClear: actions.clearEntries,
    onToggleLoop: actions.toggleLoop,
    onDelete: actions.deleteTrack,
    onEdit: actions.editTrack,
    onAdd: actions.addTrack,
    onEnableAll: () => actions.setAllTracks(true),
    onDisableAll: () => actions.setAllTracks(false),
    onPrevious: () => goToAdjacentTrack(modules, state, 'previous'),
    onNext: () => goToAdjacentTrack(modules, state, 'next')
  }
}

function bindPage(modules, state, actions, draw) {
  const { page, comments, parser } = modules

  page.onPageChanged(async () => {
    await syncVideo(modules, state)
    comments.mountLoadButtons({
      countTimelines: (text) => parser.parseTimelineComment(text).length,
      onLoad: actions.addSource
    })
    draw()
  })
}

// 유튜브는 새로고침 없이 영상을 바꾼다. 영상이 바뀌면 그 영상의 저장분으로 갈아끼운다.
async function syncVideo({ page, storage, panel }, state) {
  const videoId = page.readVideoId()

  if (videoId === state.videoId) {
    return
  }

  state.videoId = videoId
  panel.resetEditing()
  Object.assign(state, await storage.readVideoState(videoId))
}

function bindPlayback(modules, state, draw) {
  const { player } = modules

  // 재생/일시정지 아이콘이 실제 상태를 따라가야 한다.
  player.onPlayStateChanged(draw)

  player.onTimeUpdate((currentTimeSeconds) => {
    const targetSeconds = findPlaybackTarget(modules, state, currentTimeSeconds)

    if (targetSeconds !== null) {
      player.seekTo(targetSeconds)
    }

    // 재생 중인 트랙 표시가 따라오려면 시간이 흐를 때도 그려야 한다.
    // 실제 DOM 교체는 panel이 막는다(그릴 내용이 같으면 건너뛴다).
    draw()
  })
}

// 반복이 켜져 있으면 되감기가 먼저다. 그래야 영상 끝까지 갔다 오는 헛걸음이 없다.
function findPlaybackTarget({ looper, skipper }, state, currentTimeSeconds) {
  const loopTarget = state.loopEnabled
    ? looper.findLoopTarget(state.tracks, state.disabledStartSeconds, currentTimeSeconds)
    : null

  return loopTarget ?? skipper.findSkipTarget(state.tracks, state.disabledStartSeconds, currentTimeSeconds)
}

function goToAdjacentTrack({ adjacent, player }, state, direction) {
  const targetSeconds = adjacent.findAdjacentTrack(
    state.tracks,
    state.disabledStartSeconds,
    player.getCurrentTimeSeconds(),
    direction
  )

  if (targetSeconds !== null) {
    player.seekTo(targetSeconds)
  }
}
