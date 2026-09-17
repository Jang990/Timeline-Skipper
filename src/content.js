// content script는 정적 import를 못 쓴다. 이 파일은 목록대로 모듈을 불러와 넘기는 일만 한다.
// 목록은 src/modulePaths.js에, 조립은 src/wiring.js에 있다.
(async () => {
  const load = (path) => import(chrome.runtime.getURL(path))

  const { MODULE_PATHS } = await load('src/modulePaths.js')

  const loaded = await Promise.all(
    Object.entries(MODULE_PATHS).map(async ([name, path]) => [name, await load(path)])
  )

  const wiring = await load('src/wiring.js')

  wiring.start(Object.fromEntries(loaded))
})()
