import { describe, it, expect } from 'vitest'

import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { FIXTURE_VIDEO_SECONDS } from '../fixtures/media/fixtureVideo.js'

const SNAPSHOT_VIDEO_ID = '3yG8GXdnEFQ'

describe('readCommentSnapshot', () => {
  it('스냅샷 파일에서 댓글 본문 목록과 영상 길이를 읽는다', () => {
    const snapshot = readCommentSnapshot(SNAPSHOT_VIDEO_ID)

    expect(snapshot.videoId).toBe(SNAPSHOT_VIDEO_ID)
    expect(snapshot.durationSeconds).toBe(1800)
    expect(snapshot.commentTexts).toHaveLength(9)
    expect(snapshot.commentTexts[2]).toContain('00:01 01.Ballerino')
  })

  it('사람이 적어둔 메모는 반환값에 넣지 않는다', () => {
    const snapshot = readCommentSnapshot(SNAPSHOT_VIDEO_ID)

    expect(Object.keys(snapshot)).toEqual(['videoId', 'durationSeconds', 'commentTexts'])
  })

  it('없는 videoId를 넘기면 찾던 경로를 담아 예외를 던진다', () => {
    expect(() => readCommentSnapshot('없는videoId')).toThrow('없는videoId.json')
  })

  it('스냅샷의 영상 길이가 픽스처 영상 길이와 같다', () => {
    expect(readCommentSnapshot(SNAPSHOT_VIDEO_ID).durationSeconds).toBe(FIXTURE_VIDEO_SECONDS)
  })
})
