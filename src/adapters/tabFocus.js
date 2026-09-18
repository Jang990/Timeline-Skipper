// 탭을 앞으로 올리는 일은 src/background.js가 한다. 메시지 이름은 거기와 짝이다.
const FOCUS_TAB_MESSAGE = 'focus-tab'

// 확장을 다시 불러온 뒤 새로고침하지 않은 탭에서는 백그라운드와 끊겨 있어 보내기가 실패한다.
// 탭이 이미 보이는 경우가 대부분이라, 실패해도 목록으로 가는 일은 이어가게 삼킨다.
export async function focusTab() {
  try {
    await chrome.runtime.sendMessage({ type: FOCUS_TAB_MESSAGE })
  } catch {
    // 위의 이유로 무시한다.
  }
}
