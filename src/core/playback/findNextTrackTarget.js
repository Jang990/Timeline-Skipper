import { findAdjacentTrack } from './findAdjacentTrack.js'

// ⏭을 눌렀을 때 옮길 곳과 멈출지를 정한다. 갈 곳이 없으면 null.
// 마지막 트랙에서 누르면 처음으로 돌아간다. 아무 반응이 없으면 버튼이 고장 난 것처럼 보인다.
// 반복이 꺼져 있으면 목록을 한 바퀴 다 들었다는 뜻이라 처음에서 멈춰 기다린다.
export function findNextTrackTarget({ tracks, disabledStartSeconds, loopEnabled }, currentTimeSeconds) {
  const nextSeconds = findAdjacentTrack(tracks, disabledStartSeconds, currentTimeSeconds, 'next')

  if (nextSeconds !== null) {
    return { targetSeconds: nextSeconds, shouldPause: false }
  }

  const firstEnabledTrack = tracks.find((track) => !disabledStartSeconds.has(track.startSeconds))

  if (firstEnabledTrack === undefined) {
    return null
  }

  return { targetSeconds: firstEnabledTrack.startSeconds, shouldPause: !loopEnabled }
}
