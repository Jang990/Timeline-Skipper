import { describe, it, expect } from 'vitest'

import { buildFixturePage } from '../fixtures/buildFixturePage.js'

function countOccurrences(text, part) {
  return text.split(part).length - 1
}

describe('buildFixturePage', () => {
  it('패널을 붙일 자리와 video 엘리먼트가 담긴 문서를 만든다', () => {
    const html = buildFixturePage()

    expect(html).toContain('id="secondary-inner"')
    expect(html).toContain('class="html5-main-video"')
  })

  it('댓글 텍스트 하나마다 댓글 스레드 요소를 하나씩 만든다', () => {
    const html = buildFixturePage({ commentTexts: ['00:01 첫 곡', '02:30 다른 곡', '타임라인 아님'] })

    expect(countOccurrences(html, '<ytd-comment-thread-renderer>')).toBe(3)
    expect(countOccurrences(html, 'id="content-text"')).toBe(3)
  })

  it('댓글이 없으면 댓글 스레드 요소가 하나도 없는 문서를 만든다', () => {
    const html = buildFixturePage({ commentTexts: [] })

    expect(countOccurrences(html, '<ytd-comment-thread-renderer>')).toBe(0)
    expect(html).toContain('id="secondary-inner"')
  })

  it('댓글 본문을 넘긴 순서대로 문서에 담는다', () => {
    const html = buildFixturePage({ commentTexts: ['먼저 쓴 댓글', '나중에 쓴 댓글'] })

    expect(html.indexOf('먼저 쓴 댓글')).toBeLessThan(html.indexOf('나중에 쓴 댓글'))
  })

  it('영상 파일 주소를 받으면 video 엘리먼트의 src로 넣는다', () => {
    const html = buildFixturePage({ videoSourceUrl: '/fixture-3600s.mp4' })

    expect(html).toContain('<video class="html5-main-video" src="/fixture-3600s.mp4"></video>')
  })

  it('영상 파일 주소가 없으면 src 없이 video 엘리먼트만 만든다', () => {
    const html = buildFixturePage()

    expect(html).toContain('<video class="html5-main-video"></video>')
  })

  it('댓글의 줄바꿈이 innerText에 남도록 공백 처리 스타일을 넣는다', () => {
    const html = buildFixturePage({ commentTexts: ['00:01 첫 곡\n02:30 다른 곡'] })

    expect(html).toContain('white-space: pre-wrap')
    expect(html).toContain('00:01 첫 곡\n02:30 다른 곡')
  })

  it('댓글에 담긴 HTML 태그 문자열을 마크업이 아니라 글자로 넣는다', () => {
    const html = buildFixturePage({ commentTexts: ['<script>alert(1)</script> & "인용"'] })

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;인용&quot;')
  })

  it('대댓글을 넘기면 원댓글 thread 안에 대댓글 thread를 중첩해 넣는다', () => {
    const html = buildFixturePage({ commentTexts: [{ text: '원댓글', replyTexts: ['대댓글'] }] })

    expect(countOccurrences(html, '<ytd-comment-thread-renderer>')).toBe(2)
    expect(html).toContain('<ytd-comment-replies-renderer>')
    expect(html).toContain('id="expanded-threads"')
    expect(html).toContain('<yt-sub-thread>')
    expect(html.indexOf('원댓글')).toBeLessThan(html.indexOf('대댓글'))
  })

  it('대댓글이 없으면 대댓글 요소를 만들지 않는다', () => {
    const html = buildFixturePage({ commentTexts: [{ text: '원댓글', replyTexts: [] }] })

    expect(html).not.toContain('ytd-comment-replies-renderer')
    expect(countOccurrences(html, '<ytd-comment-thread-renderer>')).toBe(1)
  })

  it('문자열로 넘긴 댓글은 지금처럼 대댓글 없이 만든다', () => {
    const html = buildFixturePage({ commentTexts: ['00:01 첫 곡'] })

    expect(html).not.toContain('ytd-comment-replies-renderer')
    expect(countOccurrences(html, 'id="content-text"')).toBe(1)
  })
})
