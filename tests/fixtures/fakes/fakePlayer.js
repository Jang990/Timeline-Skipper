// jsdom의 <video>는 재생도 길이도 흉내 내지 못한다. wiring이 플레이어에게 묻는 것은
// "지금 몇 초인가"와 "거기로 옮겨라"뿐이라, 시각을 숫자 하나로 들고 있으면 충분하다.
// 진짜 영상이 이 요청에 맞춰 움직이는지는 adapters의 e2e가 맡는다.
export function createFakePlayer({ durationSeconds = 600 } = {}) {
  let currentTimeSeconds = 0
  let paused = true
  const timeHandlers = []
  const playStateHandlers = []
  const endedHandlers = []
  const seekHistory = []

  // 옮기기만 하고 알리지 않는다. 시간이 흐르는 순간은 테스트가 playTo로 직접 정한다.
  const seekTo = (timestampSeconds) => {
    seekHistory.push(timestampSeconds)
    currentTimeSeconds = timestampSeconds
  }

  const togglePlay = () => {
    paused = !paused
    playStateHandlers.forEach((handler) => handler())
  }

  return {
    getDurationSeconds: () => durationSeconds,
    getCurrentTimeSeconds: () => currentTimeSeconds,
    isPaused: () => paused,
    togglePlay,
    onTimeUpdate: (handler) => timeHandlers.push(handler),
    onPlayStateChanged: (handler) => playStateHandlers.push(handler),
    onEnded: (handler) => endedHandlers.push(handler),

    seekTo,
    seekAndPlay: (timestampSeconds) => {
      seekTo(timestampSeconds)
      paused = false
    },

    // 아래부터는 테스트가 쥐는 손잡이다.
    // 진짜 플레이어가 영상을 끝낸 순간. 끝난 영상은 멈춰 있다.
    endVideo: () => {
      paused = true
      endedHandlers.forEach((handler) => handler())
    },
    playTo: (timestampSeconds) => {
      currentTimeSeconds = timestampSeconds
      timeHandlers.forEach((handler) => handler(timestampSeconds))
    },
    seekHistory
  }
}
