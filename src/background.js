// 탭을 앞으로 가져오는 일은 탭 안의 코드로는 할 수 없다. 위젯이 PiP 창에 떠 있을 때
// 제목을 누르면 탭은 가려져 있으므로, 확장의 백그라운드가 대신 탭과 그 창을 앞으로 올린다.
// tabs.update와 windows.update는 탭의 주소나 제목을 읽지 않아 tabs 권한이 없어도 된다.
const FOCUS_TAB_MESSAGE = 'focus-tab'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== FOCUS_TAB_MESSAGE || sender.tab === undefined) {
    return false
  }

  // 응답은 탭과 창이 모두 앞으로 온 뒤에 보낸다. 보낸 쪽이 그다음에 스크롤해야 가려진 탭에서 헛돌지 않는다.
  Promise.all([
    chrome.tabs.update(sender.tab.id, { active: true }),
    chrome.windows.update(sender.tab.windowId, { focused: true })
  ]).finally(() => sendResponse())

  return true
})
