// 한 시각에 트랙은 하나뿐이다. 그래서 옮겨간 자리에 이미 항목이 있으면 덮어쓴다.
// 덮어쓰지 않으면 buildTracks가 먼저 적힌 쪽만 남겨서, 수정이 무시된 것처럼 보인다.
//
// previousTimestampSeconds가 null이면 옮겨올 항목이 없다는 뜻이라 추가가 된다.
export function upsertEntry(entries, previousTimestampSeconds, entry) {
  const kept = entries.filter(
    (item) =>
      item.timestampSeconds !== previousTimestampSeconds &&
      item.timestampSeconds !== entry.timestampSeconds
  )

  // 정렬은 buildTracks의 몫이므로 뒤에 붙이기만 한다.
  return [...kept, entry]
}
