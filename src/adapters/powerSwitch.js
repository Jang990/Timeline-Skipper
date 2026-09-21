// 켜고 끄는 것은 영상이 아니라 사람에게 붙는다. 팝업이 여기에 쓰면 열린 탭이 모두 알림을 받는다.
// "꺼짐"으로 저장하는 이유: 값이 아직 없는 처음 설치 상태가 곧 켜짐이 된다.
const TURNED_OFF_KEY = 'turnedOff'

export async function readTurnedOff() {
  const stored = await chrome.storage.local.get(TURNED_OFF_KEY)

  return stored[TURNED_OFF_KEY] === true
}

export async function writeTurnedOff(isTurnedOff) {
  await chrome.storage.local.set({ [TURNED_OFF_KEY]: isTurnedOff })
}

export function onTurnedOffChanged(handler) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && TURNED_OFF_KEY in changes) {
      handler(changes[TURNED_OFF_KEY].newValue === true)
    }
  })
}
