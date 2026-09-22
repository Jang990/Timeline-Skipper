import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { vi } from 'vitest'
import { buildFixturePage } from '../buildFixturePage.js'
import { FIXTURE_VIDEO_SECONDS } from '../media/fixtureVideo.js'
import { createFakePlayer } from './fakePlayer.js'
import { createFakeStorage } from './fakeStorage.js'
import { createFakeClipboard, createFakeComments, createFakeFullscreen, createFakePage, createFakePictureInPicture, createFakePower, createFakeTabFocus } from './fakePlatform.js'
import { MODULE_PATHS } from '../../../src/modulePaths.js'

const PANEL_ID = 'timeline-skip-panel'

// 목록의 경로는 확장 루트 기준이다. jsdom 환경에서는 전역 URL이 jsdom의 것이라 node의 URL 도구와
// 섞이지 않는다. 그래서 URL 객체를 만들지 않고 파일 경로로만 계산한다.
const EXTENSION_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

// 영상 길이는 e2e의 픽스처 영상과 맞춘다. 짧으면 그 뒤의 트랙이 목록에서 잘려 나간다.
// 진짜 core·ui에 가짜 플레이어·저장소·플랫폼을 붙여 확장을 띄운다.
// 같은 storage를 넘겨 다시 부르면 새로고침과 같다. restart가 그 일을 한다.
export async function startWithFakes({
  videoId = 'fixture-video',
  durationSeconds = FIXTURE_VIDEO_SECONDS,
  storage = createFakeStorage(),
  pictureInPicture = createFakePictureInPicture(),
  power = createFakePower()
} = {}) {
  // panel과 floating은 모듈 안에 상태를 들고 있다. 새로 불러오지 않으면 앞 테스트의 상태가 남는다.
  vi.resetModules()
  document.body.innerHTML = new DOMParser().parseFromString(buildFixturePage(), 'text/html').body.innerHTML

  const fakes = {
    player: createFakePlayer({ durationSeconds }),
    storage,
    page: createFakePage({ videoId }),
    comments: createFakeComments(),
    fullscreen: createFakeFullscreen(),
    pictureInPicture,
    tabFocus: createFakeTabFocus(),
    clipboard: createFakeClipboard(),
    power
  }
  const wiring = await import('../../../src/wiring.js')

  wiring.start({ ...(await importRealModules(Object.keys(fakes))), ...fakes })
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

// 확장이 쓰는 목록 그대로 불러오되, 가짜가 있는 자리는 건너뛴다.
async function importRealModules(fakeNames) {
  const realEntries = Object.entries(MODULE_PATHS).filter(([name]) => !fakeNames.includes(name))
  const entries = await Promise.all(
    realEntries.map(async ([name, path]) => [name, await import(/* @vite-ignore */ pathToFileURL(resolve(EXTENSION_ROOT, path)).href)])
  )

  return Object.fromEntries(entries)
}
