// 시각을 바 위의 자리(0~1)로 바꾼다. 픽셀은 화면의 몫이라 여기서는 비율까지만 만든다.
export function toBarRatio(seconds, { fromSeconds, toSeconds }) {
  if (!Number.isFinite(seconds)) {
    return null
  }

  const lengthSeconds = toSeconds - fromSeconds

  if (lengthSeconds <= 0) {
    return 0
  }

  // 재생 위치처럼 범위 밖의 시각도 들어온다. 바 밖으로 삐져나가느니 가장자리에 물린다.
  return Math.min(Math.max((seconds - fromSeconds) / lengthSeconds, 0), 1)
}
