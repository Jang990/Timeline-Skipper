// 유튜브 시청 페이지를 통째로 저장하지 않는 이유: 저장본은 수십 MB에 자기 JS가 다시 돌면서
// 판을 깨뜨린다. 확장이 실제로 읽는 것은 selectors.js의 네 곳뿐이라 그것만 세우면 된다.
//
// 댓글 본문의 중첩 깊이는 2026-08-27 실측 구조를 따랐다. 얕게 만들면 버튼을 꽂는 자리의
// overflow: hidden 이 사라져서, 실제 페이지에서만 버튼이 안 보이는 상황을 놓치게 된다.

const CONTENT_TEXT_STYLE = '#content-text { white-space: pre-wrap; }'

export function buildFixturePage({ commentTexts = [], videoSourceUrl = null } = {}) {
  return [
    '<!doctype html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>타임라인 스킵 e2e 픽스처</title>',
    // 댓글의 줄바꿈이 innerText에 남아야 한다. 이 스타일이 없으면 여러 줄 댓글이
    // 한 줄로 합쳐져서 parseTimelineComment가 첫 줄 하나만 보게 된다.
    `<style>${CONTENT_TEXT_STYLE}</style>`,
    '</head>',
    '<body>',
    '<div id="secondary-inner"></div>',
    buildVideo(videoSourceUrl),
    '<div id="comments">',
    ...commentTexts.map(buildCommentThread),
    '</div>',
    '</body>',
    '</html>'
  ].join('\n')
}

function buildVideo(videoSourceUrl) {
  if (videoSourceUrl === null) {
    return '<video class="html5-main-video"></video>'
  }

  return `<video class="html5-main-video" src="${escapeHtml(videoSourceUrl)}"></video>`
}

function buildCommentThread(comment) {
  const { text, replyTexts } = toComment(comment)

  return [
    '<ytd-comment-thread-renderer>',
    buildCommentBody(text),
    ...(replyTexts.length === 0 ? [] : [buildReplies(replyTexts)]),
    '</ytd-comment-thread-renderer>'
  ].join('\n')
}

// 대댓글이 필요한 댓글만 객체로 넘긴다. 문자열로 넘기는 기존 호출은 그대로 둔다.
function toComment(comment) {
  return typeof comment === 'string'
    ? { text: comment, replyTexts: [] }
    : { replyTexts: [], ...comment }
}

function buildCommentBody(commentText) {
  return [
    '<ytd-comment-view-model id="comment"><div id="body"><div id="main">',
    '<ytd-expander id="expander"><div id="content" style="overflow: hidden">',
    `<yt-attributed-string id="content-text">${escapeHtml(commentText)}</yt-attributed-string>`,
    '</div></ytd-expander>',
    '</div></div></ytd-comment-view-model>'
  ].join('\n')
}

// 대댓글은 원댓글 thread 안에 자기 thread를 갖고 중첩된다. 이 중첩 자체가 검증 대상이다 —
// 확장에는 대댓글을 위한 코드가 없고, 자손 셀렉터가 대댓글까지 잡아주는 것에 기대고 있다.
// 아래 구조는 2026-09-10 크롬 개발자 도구에서 실제 시청 페이지로 확인했다.
function buildReplies(replyTexts) {
  return [
    '<ytd-comment-replies-renderer><div id="expanded-threads">',
    ...replyTexts.map(buildReplyThread),
    '</div></ytd-comment-replies-renderer>'
  ].join('\n')
}

function buildReplyThread(replyText) {
  return [
    '<yt-sub-thread><div>',
    '<ytd-comment-thread-renderer><div id="comment-container">',
    buildCommentBody(replyText),
    '</div></ytd-comment-thread-renderer>',
    '</div></yt-sub-thread>'
  ].join('\n')
}

// 댓글은 남이 쓴 문자열이다. 픽스처에서도 마크업으로 새지 않게 한다.
function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}
