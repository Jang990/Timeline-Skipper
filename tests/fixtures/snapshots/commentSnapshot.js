import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// 스냅샷은 실제 유튜브 댓글 원문이다. 파서가 좋아하는 모양으로 손질하면 픽스처가 실측이
// 아니게 되므로 본문은 고치지 않는다. 영상 길이에 맞춰 뒤를 잘라내는 것까지만 한다.
//
// note 와 sourceDurationSeconds 는 사람이 읽는 메모라 테스트에 넘기지 않는다.
const REQUIRED_FIELDS = ['videoId', 'durationSeconds', 'commentTexts']

export function readCommentSnapshot(videoId) {
  const snapshotPath = fileURLToPath(new URL(`./${videoId}.json`, import.meta.url))
  const snapshot = parseSnapshot(readSnapshotFile(snapshotPath), snapshotPath)

  return {
    videoId: snapshot.videoId,
    durationSeconds: snapshot.durationSeconds,
    commentTexts: snapshot.commentTexts
  }
}

// 빈 값을 돌려주면 이 파일이 아니라 저 멀리 spec에서 "트랙이 0개다"라는 증상으로만 나타난다.
// 어느 파일을 찾다 실패했는지가 유일하게 쓸모 있는 정보라 메시지에 경로를 담는다.
function readSnapshotFile(snapshotPath) {
  try {
    return readFileSync(snapshotPath, 'utf8')
  } catch {
    throw new Error(`댓글 스냅샷을 찾을 수 없다: ${snapshotPath}`)
  }
}

function parseSnapshot(snapshotText, snapshotPath) {
  const snapshot = JSON.parse(snapshotText)
  const missingFields = REQUIRED_FIELDS.filter((fieldName) => snapshot[fieldName] === undefined)

  if (missingFields.length > 0) {
    throw new Error(`댓글 스냅샷에 ${missingFields.join(', ')}가 없다: ${snapshotPath}`)
  }

  return snapshot
}
