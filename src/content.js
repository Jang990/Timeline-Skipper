// content script는 정적 import를 못 쓴다. 이 파일은 모듈을 불러와 넘기는 일만 한다.
// 조립은 src/wiring.js에 있다.
(async () => {
  const load = (path) => import(chrome.runtime.getURL(path))

  const modulePaths = {
    parser: 'src/core/parseTimelineComment.js',
    builder: 'src/core/buildTracks.js',
    skipper: 'src/core/findSkipTarget.js',
    looper: 'src/core/findLoopTarget.js',
    adjacent: 'src/core/findAdjacentTrack.js',
    bulk: 'src/core/setAllTracksEnabled.js',
    remover: 'src/core/removeEntriesAt.js',
    flagMover: 'src/core/moveDisabledFlag.js',
    upserter: 'src/core/upsertEntry.js',
    player: 'src/adapters/youtubePlayer.js',
    comments: 'src/adapters/youtubeComments.js',
    page: 'src/adapters/youtubePage.js',
    storage: 'src/adapters/storage.js',
    panel: 'src/ui/panel.js'
  }

  const loaded = await Promise.all(
    Object.entries(modulePaths).map(async ([name, path]) => [name, await load(path)])
  )

  const wiring = await load('src/wiring.js')

  wiring.start(Object.fromEntries(loaded))
})()
