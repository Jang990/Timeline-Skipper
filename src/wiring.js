import { createTrackActions } from './trackActions.js'

// core / adapters / ui를 연결한다. 계산은 core에, DOM은 adapters와 ui에 있다.
export function start(modules) {
  const { builder, player, storage, panel, floating, fullscreen, floatingState } = modules

  const state = {
    videoId: null,
    entries: [],
    disabledStartSeconds: new Set(),
    loopEnabled: false,
    tracks: [],

    // 저장된 설정을 읽어 오기 전까지 쓸 값. 저장분이 없을 때와 같은 모습이어야 한다.
    ...floatingState.toValidSettings(undefined)
  }

  const draw = () => {
    state.tracks = builder.buildTracks(state.entries, player.getDurationSeconds())

    // 패널과 플로팅 위젯은 같은 것을 보여준다. view를 나눠 가져야 둘이 어긋나지 않는다.
    const view = toView(modules, state, actions, commitSettings)

    panel.render(view)
    floating.render(view)
  }

  // 저장과 그리기는 항상 함께 일어난다. 동작들은 이 하나만 알면 된다.
  const commit = () => {
    storage.writeVideoState(state.videoId, state)
    draw()
  }

  // 표시 설정은 영상이 아니라 사람에게 붙는다. 저장하는 곳이 달라서 commit과 나눈다.
  const commitSettings = (changes) => {
    Object.assign(state, changes)
    storage.writeSettings(state)
    draw()
  }

  const actions = createTrackActions({ state, modules, commit })

  bindPage(modules, state, actions, draw)
  bindPlayback(modules, state, draw)
  fullscreen.onFullscreenChanged(draw)
  loadSettings(modules, state, draw)
}

// 설정을 읽는 동안에도 화면은 떠 있어야 한다. 읽고 나서 다시 그린다.
async function loadSettings({ storage, floatingState }, state, draw) {
  Object.assign(state, floatingState.toValidSettings(await storage.readSettings()))
  draw()
}

function toView(modules, state, actions, commitSettings) {
  const { player, playing, panelReveal, fullscreen } = modules

  return {
    tracks: state.tracks,
    disabledStartSeconds: state.disabledStartSeconds,
    loopEnabled: state.loopEnabled,
    playingStartSeconds: playing.findPlayingStartSeconds(state.tracks, player.getCurrentTimeSeconds()),
    isPaused: player.isPaused(),
    isFullscreen: fullscreen.isFullscreen(),
    floatingHidden: state.floatingHidden,
    floatingExpanded: state.floatingExpanded,
    getCurrentTimeSeconds: player.getCurrentTimeSeconds,
    getDurationSeconds: player.getDurationSeconds,
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
    onNext: () => goToAdjacentTrack(modules, state, 'next'),
    onRevealPanel: panelReveal.reveal,
    onSetFloatingHidden: (floatingHidden) => commitSettings({ floatingHidden }),
    onSetFloatingExpanded: (floatingExpanded) => commitSettings({ floatingExpanded })
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
  const { player, playback, panel } = modules

  // 재생/일시정지 아이콘이 실제 상태를 따라가야 한다.
  player.onPlayStateChanged(draw)

  // 끝 칸이 재생 위치를 따라가는지는 패널만 안다. 옮길지 말지는 core가 정한다.
  player.onTimeUpdate((currentTimeSeconds) => {
    const targetSeconds = playback.findPlaybackTarget({ ...state, isFollowing: panel.isFollowing() }, currentTimeSeconds)

    if (targetSeconds !== null) {
      player.seekTo(targetSeconds)
    }

    // 재생 중인 트랙 표시가 따라오려면 시간이 흐를 때도 그려야 한다.
    // 실제 DOM 교체는 panel이 막는다(그릴 내용이 같으면 건너뛴다).
    draw()
  })
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
