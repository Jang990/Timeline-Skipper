import { findTrackAtTime } from './findTrackAtTime.js'

// 강조에 필요한 건 시작 시각뿐이다. 트랙 객체를 통째로 넘기면 UI가 트랙 모양에 묶인다.
// 체크가 해제된 트랙도 그 구간을 지나는 동안에는 재생 중이다. 스킵이 곧 다음 트랙으로 옮겨준다.
export function findPlayingStartSeconds(tracks, currentTimeSeconds) {
  return findTrackAtTime(tracks, currentTimeSeconds)?.startSeconds ?? null
}
