// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'
import { startWithFakes, settle } from '../fixtures/fakes/startWithFakes.js'

// 다른 테스트의 댓글은 파서가 좋아하는 모양으로 손으로 쓴 것이다. 여기만 실제 댓글 원문 위에서
// 돈다 — 번호가 붙은 제목, 점과 말줄임표, 타임라인이 아닌 잡댓글 여덟 개가 섞인 목록.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

const ROW = '.timeline-skip-row'

describe('실제 댓글 스냅샷', () => {
  it('스냅샷 댓글을 불러오면 트랙 8개가 목록에 뜬다', async () => {
    await startWithFakes({ commentTexts })

    await loadFirstTimeline()

    expect(document.querySelectorAll(ROW)).toHaveLength(8)
  })

  it('첫 트랙은 00:01 01.Ballerino, 마지막 트랙은 29:55 08. 나란 놈은 답은 너다로 뜬다', async () => {
    await startWithFakes({ commentTexts })

    await loadFirstTimeline()

    const rows = document.querySelectorAll(ROW)
    expect(readRow(rows[0])).toEqual({ time: '00:01', title: '01.Ballerino' })
    expect(readRow(rows[rows.length - 1])).toEqual({ time: '29:55', title: '08. 나란 놈은 답은 너다' })
  })
})

async function loadFirstTimeline() {
  document.querySelector('.timeline-skip-load-button').click()
  await settle()
}

function readRow(row) {
  return {
    time: row.querySelector('.timeline-skip-time').textContent,
    title: row.querySelector('.timeline-skip-title').textContent
  }
}
