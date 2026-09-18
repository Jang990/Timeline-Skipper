// 탭을 떠나도 보이는 창은 Document Picture-in-Picture로만 만들 수 있다. 영상 PiP는 영상밖에 못 담는다.
// 창의 위치는 크롬이 정하고 사람이 끌어 옮긴다. 여기서 정할 수 있는 것은 처음 크기뿐이다.
const WINDOW_SIZE = { width: 360, height: 150 }

const TOKEN_PREFIX = '--timeline-skip-'

// 창은 탭마다 하나뿐이고 탭이 살아 있는 동안만 산다. 그래서 모듈이 들고 있는다.
let pictureInPictureWindow = null
const changedHandlers = []

export function isSupported() {
  return 'documentPictureInPicture' in window
}

// 크롬은 클릭 같은 사람의 손길 안에서만 창을 열어준다. 버튼의 클릭 처리에서 곧장 불러야 한다.
export async function open() {
  if (pictureInPictureWindow !== null) {
    return
  }

  const openedWindow = await window.documentPictureInPicture.requestWindow(WINDOW_SIZE)
  pictureInPictureWindow = openedWindow

  copyThemeTokens(openedWindow.document)
  await adoptExtensionStyles(openedWindow)
  openedWindow.addEventListener('pagehide', () => {
    pictureInPictureWindow = null
    notifyChanged()
  })
  notifyChanged()
}

export function close() {
  pictureInPictureWindow?.close()
}

// 창이 없으면 탭의 문서가 그 자리를 대신한다. 그리는 쪽은 어디에 그리는지 따지지 않아도 된다.
export function getDocument() {
  return pictureInPictureWindow?.document ?? null
}

export function onChanged(handler) {
  changedHandlers.push(handler)
}

function notifyChanged() {
  changedHandlers.forEach((handler) => handler())
}

// content script의 CSS는 탭에만 들어가고 새 창에는 따라오지 않는다. manifest의 목록을 그대로 읽어
// 같은 파일을 붙인다. <link>나 <style>은 유튜브의 CSP를 물려받은 창에서 막힐 수 있어 CSSOM으로 넣는다.
async function adoptExtensionStyles(targetWindow) {
  const stylePaths = chrome.runtime.getManifest().content_scripts.flatMap((script) => script.css ?? [])
  const styleTexts = await Promise.all(
    stylePaths.map(async (path) => (await fetch(chrome.runtime.getURL(path))).text())
  )

  targetWindow.document.adoptedStyleSheets = styleTexts.map((styleText) => {
    const sheet = new targetWindow.CSSStyleSheet()
    sheet.replaceSync(styleText)

    return sheet
  })
}

// 색 변수는 플랫폼이 탭의 문서 루트에 정해 둔 테마 값을 따른다. 새 창에는 그 값이 없어서
// 계산이 끝난 값을 옮겨 적는다. 창을 연 뒤에 테마를 바꾸면 다시 열어야 따라온다.
function copyThemeTokens(targetDocument) {
  const computedStyle = getComputedStyle(document.documentElement)

  for (const propertyName of computedStyle) {
    if (propertyName.startsWith(TOKEN_PREFIX)) {
      targetDocument.documentElement.style.setProperty(propertyName, computedStyle.getPropertyValue(propertyName))
    }
  }
}
