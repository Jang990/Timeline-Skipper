import { vi } from 'vitest'
import { buildFixturePage } from '../buildFixturePage.js'
import { createFakePlayer } from './fakePlayer.js'
import { createFakeStorage } from './fakeStorage.js'
import { createFakeComments, createFakeFullscreen, createFakePage } from './fakePlatform.js'

const PANEL_ID = 'timeline-skip-panel'

// src/content.js의 목록에서 플랫폼 어댑터를 뺀 것이다. content.js는 불러올 수 없는
// 로더라서 목록을 나눠 가질 수 없다. 모듈이 늘면 두 곳을 함께 고친다.
const REAL_MODULE_IMPORTS = {
  parser: () => import('../../../src/core/parse/parseTimelineComment.js'),
  builder: () => import('../../../src/core/tracks/buildTracks.js'),
  playing: () => import('../../../src/core/tracks/findPlayingStartSeconds.js'),
  playback: () => import('../../../src/core/playback/findPlaybackTarget.js'),
  adjacent: () => import('../../../src/core/playback/findAdjacentTrack.js'),
  bulk: () => import('../../../src/core/selection/setAllTracksEnabled.js'),
  remover: () => import('../../../src/core/entries/removeEntriesAt.js'),
  flagMover: () => import('../../../src/core/selection/moveDisabledFlag.js'),
  upserter: () => import('../../../src/core/entries/upsertEntry.js'),
  panel: () => import('../../../src/ui/panel.js'),
  floatingState: () => import('../../../src/ui/floatingState.js'),
  panelReveal: () => import('../../../src/ui/panelReveal.js'),
  floating: () => import('../../../src/ui/floating.js')
}

// 진짜 core·ui에 가짜 플레이어·저장소·플랫폼을 붙여 확장을 띄운다.
// 같은 storage를 넘겨 다시 부르면 새로고침과 같다. restart가 그 일을 한다.
export async function startWithFakes({ videoId = 'fixture-video', durationSeconds = 600, storage = createFakeStorage() } = {}) {
  // panel과 floating은 모듈 안에 상태를 들고 있다. 새로 불러오지 않으면 앞 테스트의 상태가 남는다.
  vi.resetModules()
  document.body.innerHTML = new DOMParser().parseFromString(buildFixturePage(), 'text/html').body.innerHTML

  const fakes = {
    player: createFakePlayer({ durationSeconds }),
    storage,
    page: createFakePage({ videoId }),
    comments: createFakeComments(),
    fullscreen: createFakeFullscreen()
  }
  const wiring = await import('../../../src/wiring.js')

  wiring.start({ ...(await importRealModules()), ...fakes })
  await settle()

  return {
    ...fakes,
    findPanel: () => document.getElementById(PANEL_ID),
    restart: () => startWithFakes({ videoId, durationSeconds, storage })
  }
}

// 저장분과 설정 읽기는 비동기다. 이미 풀린 약속들이 모두 이어질 때까지 한 박자 쉰다.
export function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

async function importRealModules() {
  const entries = await Promise.all(
    Object.entries(REAL_MODULE_IMPORTS).map(async ([name, importModule]) => [name, await importModule()])
  )

  return Object.fromEntries(entries)
}
