// 영상마다 따로 저장한다. sync가 아니라 local인 이유는 용량 제한이 훨씬 넉넉하고,
// 트랙 목록은 기기 간에 공유할 만한 값이 아니기 때문이다.
const KEY_PREFIX = 'video:'

function toStorageKey(videoId) {
  return `${KEY_PREFIX}${videoId}`
}

function emptyState() {
  return { entries: [], disabledStartSeconds: new Set(), loopEnabled: false }
}

export async function readVideoState(videoId) {
  // 시청 페이지가 아니면 읽을 것도 저장할 것도 없다.
  if (videoId === null) {
    return emptyState()
  }

  const storageKey = toStorageKey(videoId)
  const stored = await chrome.storage.local.get(storageKey)
  const saved = stored[storageKey]

  if (saved === undefined) {
    return emptyState()
  }

  return {
    entries: saved.entries ?? [],
    disabledStartSeconds: new Set(saved.disabled ?? []),
    loopEnabled: saved.loopEnabled ?? false
  }
}

// Set은 그대로 저장되지 않으므로 경계에서 배열로 바꾼다.
export async function writeVideoState(videoId, { entries, disabledStartSeconds, loopEnabled }) {
  if (videoId === null) {
    return
  }

  await chrome.storage.local.set({
    [toStorageKey(videoId)]: {
      entries,
      disabled: [...disabledStartSeconds],
      loopEnabled
    }
  })
}
