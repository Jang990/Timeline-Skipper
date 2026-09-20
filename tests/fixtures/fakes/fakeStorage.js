// chrome.storage는 jsdom에 없다. 같은 네 함수를 메모리 위에서 흉내 낸다.
// 넣고 뺄 때 복사하는 이유: 진짜 저장소도 값을 복사해 두므로, 저장한 뒤 state를 고쳐도
// 저장분은 그대로여야 "다시 시작해도 남는다"는 확인이 의미가 있다.
// Set을 배열로 바꾸는 진짜 저장 형식은 흉내 내지 않는다. 그것은 adapters의 e2e가 맡는다.
export function createFakeStorage() {
  const videoStates = new Map()
  let settings

  return {
    readVideoState: async (videoId) => structuredClone(videoStates.get(videoId) ?? emptyState()),

    writeVideoState: async (videoId, { entries, disabledStartSeconds, loopEnabled }) => {
      if (videoId === null) {
        return
      }

      videoStates.set(videoId, structuredClone({ entries, disabledStartSeconds, loopEnabled }))
    },

    readSettings: async () => structuredClone(settings),

    writeSettings: async ({ floatingHidden, floatingExpanded, floatingPosition }) => {
      settings = structuredClone({ floatingHidden, floatingExpanded, floatingPosition })
    }
  }
}

function emptyState() {
  return { entries: [], disabledStartSeconds: new Set(), loopEnabled: false }
}
