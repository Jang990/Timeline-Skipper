import { SELECTORS } from './selectors.js'

function findVideoElement() {
  return document.querySelector(SELECTORS.video)
}

// 재생 준비 전에는 NaN이다. buildTracks가 "길이를 모르는 상태"로 처리한다.
export function getDurationSeconds() {
  return findVideoElement()?.duration ?? Number.NaN
}

export function getCurrentTimeSeconds() {
  return findVideoElement()?.currentTime ?? 0
}

export function seekTo(timestampSeconds) {
  const video = findVideoElement()

  if (video !== null) {
    video.currentTime = timestampSeconds
  }
}

// 브라우저는 영상이 끝나는 순간 멈춰 두고, 그 뒤 위치를 옮겨도 멈춤을 풀지 않는다.
// 재생 중 자동으로 옮길 때는 끝까지 재생되던 흐름을 이어야 하므로 다시 재생한다.
// 사람이 멈춰 둔 영상은 끝난 상태가 아니라서 그대로 멈춰 있다.
export function seekAndKeepPlaying(timestampSeconds) {
  const video = findVideoElement()

  if (video === null) {
    return
  }

  const wasEnded = video.ended
  video.currentTime = timestampSeconds

  if (wasEnded) {
    video.play()
  }
}

export function isPaused() {
  return findVideoElement()?.paused ?? true
}

export function togglePlay() {
  const video = findVideoElement()

  if (video === null) {
    return
  }

  if (video.paused) {
    video.play()
  } else {
    video.pause()
  }
}

// 미디어 이벤트는 버블링하지 않는다. 캡처 단계로 받으면 video 엘리먼트가 언제 생기든
// document에 한 번만 등록해두면 되고, 영상이 바뀌어도 다시 붙일 필요가 없다.
function listenInCapturePhase(eventNames, listener) {
  for (const eventName of eventNames) {
    document.addEventListener(eventName, listener, true)
  }
}

export function onTimeUpdate(handler) {
  listenInCapturePhase(['timeupdate'], (event) => handler(event.target.currentTime))
}

export function onPlayStateChanged(handler) {
  listenInCapturePhase(['play', 'pause'], () => handler())
}
