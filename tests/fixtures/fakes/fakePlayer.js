// jsdom의 <video>는 재생도 길이도 흉내 내지 못한다. wiring이 플레이어에게 묻는 것은
// "지금 몇 초인가"와 "거기로 옮겨라"뿐이라, 시각을 숫자 하나로 들고 있으면 충분하다.
// 진짜 영상이 이 요청에 맞춰 움직이는지는 adapters의 e2e가 맡는다.
export function createFakePlayer({ durationSeconds = 600 } = {}) {
  let currentTimeSeconds = 0
  let paused = true
  const timeHandlers = []
  const playStateHandlers = []
  const seekHistory = []

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

    // 옮기기만 하고 알리지 않는다. 시간이 흐르는 순간은 테스트가 playTo로 직접 정한다.
    seekTo: (timestampSeconds) => {
      seekHistory.push(timestampSeconds)
      currentTimeSeconds = timestampSeconds
    },

    // 아래부터는 테스트가 쥐는 손잡이다.
    playTo: (timestampSeconds) => {
      currentTimeSeconds = timestampSeconds
      timeHandlers.forEach((handler) => handler(timestampSeconds))
    },
    seekHistory
  }
}
