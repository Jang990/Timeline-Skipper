import manifest from '../../manifest.json'
import { buildFixturePage } from './buildFixturePage.js'
import { createFakePlayer } from './fakes/fakePlayer.js'
import { createFakeStorage } from './fakes/fakeStorage.js'
import { createFakeClipboard, createFakeComments, createFakeFullscreen, createFakePage, createFakePictureInPicture, createFakePower, createFakeTabFocus } from './fakes/fakePlatform.js'
import { MODULE_PATHS } from '../../src/modulePaths.js'

const PANEL_ID = 'timeline-skip-panel'
const PAGE_URL = 'https://www.youtube.com/watch'

// media/fixtureVideo.js의 값과 같다. 그 파일은 node로 영상을 읽어서 브라우저에서는 불러올 수 없다.
const FIXTURE_VIDEO_SECONDS = 1800

let startCount = 0
let stylesLoaded = null

// 브라우저 테스트용 startWithFakes. 확장은 설치하지 않고, 진짜 브라우저에 패널만 띄워
// 크기·위치·색을 잴 수 있게 한다. CSS는 manifest가 유튜브 페이지에 붙이는 목록 그대로다.
export async function startInBrowser() {
  startCount += 1
  await (stylesLoaded ??= loadExtensionStyles())
  mountFixturePage()

  const fakes = {
    player: createFakePlayer({ durationSeconds: FIXTURE_VIDEO_SECONDS }),
    storage: createFakeStorage(),
    page: createFakePage({ videoId: 'fixture-video' }),
    comments: createFakeComments(),
    fullscreen: createFakeFullscreen(),
    pictureInPicture: createFakePictureInPicture(),
    tabFocus: createFakeTabFocus(),
    clipboard: createFakeClipboard(),
    power: createFakePower()
  }
  const wiring = await importFresh('src/wiring.js')

  wiring.start({ ...(await importRealModules(Object.keys(fakes))), ...fakes })
  await new Promise((resolve) => setTimeout(resolve, 0))

  return { ...fakes, findPanel: () => document.getElementById(PANEL_ID) }
}

function loadExtensionStyles() {
  const paths = manifest.content_scripts
    .filter((script) => script.matches.some((pattern) => PAGE_URL.startsWith(pattern.replace('*', ''))))
    .flatMap((script) => script.css ?? [])

  return Promise.all(paths.map((path) => new Promise((resolve, reject) => {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: `/${path}` })
    link.onload = resolve
    link.onerror = () => reject(new Error(`CSS를 불러오지 못했다: ${path}`))
    document.head.append(link)
  })))
}

// 픽스처 문서의 head에 있는 스타일도 옮겨야 댓글 칸의 줄바꿈 같은 모양이 e2e와 같아진다.
function mountFixturePage() {
  const parsed = new DOMParser().parseFromString(buildFixturePage(), 'text/html')
  document.querySelectorAll('style[data-fixture]').forEach((style) => style.remove())
  parsed.head.querySelectorAll('style').forEach((style) => {
    style.dataset.fixture = ''
    document.head.append(style)
  })
  document.body.innerHTML = parsed.body.innerHTML
}

// panel과 floating은 모듈 안에 상태를 들고 있다. 시작마다 주소를 바꿔 새로 불러온다.
function importFresh(path) {
  return import(/* @vite-ignore */ `/${path}?start=${startCount}`)
}

async function importRealModules(fakeNames) {
  const realEntries = Object.entries(MODULE_PATHS).filter(([name]) => !fakeNames.includes(name))
  const entries = await Promise.all(realEntries.map(async ([name, path]) => [name, await importFresh(path)]))

  return Object.fromEntries(entries)
}
