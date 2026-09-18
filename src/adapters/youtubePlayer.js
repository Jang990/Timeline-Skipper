import { PLAYER_STATE_CLASSES, SELECTORS } from './selectors.js'

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

// 끝나서 멈춘 영상은 위치만 옮겨서는 멈춤이 풀리지 않는다. 되감으면서 재생까지 건다.
export function seekAndPlay(timestampSeconds) {
  const video = findVideoElement()

  if (video === null) {
    return
  }

  video.currentTime = timestampSeconds
  video.play()
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

// 유튜브는 끝 너머로 옮기거나 끝까지 재생해도 video의 ended를 켜지 않는다. 그 자리에서 멈추고
// 플레이어에 종료 표시만 붙인다. 재생 시각으로는 알 수 없어서 이 표시가 붙는 순간을 듣는다.
// 플레이어는 영상이 바뀌어도 그대로라, 처음 재생될 때 한 번만 지켜보기 시작하면 된다.
export function onEnded(handler) {
  const watchedPlayers = new WeakSet()

  listenInCapturePhase(['play'], (event) => {
    const playerElement = event.target.closest(SELECTORS.player)

    if (playerElement === null || watchedPlayers.has(playerElement)) {
      return
    }

    watchedPlayers.add(playerElement)
    watchEndedMark(playerElement, handler)
  })
}

// 표시가 없다가 생길 때만 알린다. 클래스는 종료와 무관한 이유로도 수시로 바뀐다.
function watchEndedMark(playerElement, handler) {
  let wasEnded = playerElement.classList.contains(PLAYER_STATE_CLASSES.ended)

  new MutationObserver(() => {
    const isEnded = playerElement.classList.contains(PLAYER_STATE_CLASSES.ended)

    if (isEnded && !wasEnded) {
      handler()
    }

    wasEnded = isEnded
  }).observe(playerElement, { attributes: true, attributeFilter: ['class'] })
}
