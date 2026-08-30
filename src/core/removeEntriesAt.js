// 같은 시각의 항목은 여러 댓글에서 겹쳐 들어올 수 있다.
// 목록에는 하나로 보이므로, 지울 때도 그 시각의 것을 전부 지워야 한 번에 사라진다.
export function removeEntriesAt(entries, timestampSeconds) {
  return entries.filter((entry) => entry.timestampSeconds !== timestampSeconds)
}
