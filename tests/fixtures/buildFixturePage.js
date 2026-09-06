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

function buildCommentThread(commentText) {
  return [
    '<ytd-comment-thread-renderer>',
    '<ytd-comment-view-model id="comment"><div id="body"><div id="main">',
    '<ytd-expander id="expander"><div id="content" style="overflow: hidden">',
    `<yt-attributed-string id="content-text">${escapeHtml(commentText)}</yt-attributed-string>`,
    '</div></ytd-expander>',
    '</div></div></ytd-comment-view-model>',
    '</ytd-comment-thread-renderer>'
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
