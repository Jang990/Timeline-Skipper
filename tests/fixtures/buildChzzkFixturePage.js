// 치지직 다시보기 페이지를 통째로 저장하지 않는 이유는 유튜브 픽스처와 같다 —
// 저장본은 자기 JS가 다시 돌면서 판을 깨뜨린다. 확장이 읽는 자리만 세운다.
//
// 아래 구조는 2026-09-23 실제 다시보기 페이지에서 확인했다.
// 클래스 뒤의 해시는 치지직 빌드가 붙인 것이다. 확장은 이름 앞부분만 맞춰야 하므로
// 픽스처에도 해시를 남겨 둔다. 해시를 빼면 앞부분만 맞추는지 검증하지 못한다.
export function buildChzzkFixturePage({ videoSourceUrl = null, comments = [] } = {}) {
  return [
    '<!doctype html>',
    '<html lang="ko" class="theme_dark" data-theme="theme_dark">',
    '<head>',
    '<meta charset="utf-8">',
    '<title>치지직 다시보기 e2e 픽스처</title>',
    '</head>',
    '<body>',
    '<div class="_content_z51yg_24">',
    buildPlayer(videoSourceUrl),
    buildAside(),
    '<div class="_content_left_z51yg_116"></div>',
    // 패널이 붙는 자리. 실제 페이지에서는 채팅 아래, "영상 더보기" 위다.
    '<div class="_content_right_z51yg_134"></div>',
    buildComments(comments),
    '</div>',
    '</body>',
    '</html>'
  ].join('\n')
}

function buildPlayer(videoSourceUrl) {
  const source = videoSourceUrl === null ? '' : ` src="${escapeHtml(videoSourceUrl)}"`

  return [
    '<div id="player_layout" class="chzzk_player type_vod">',
    '<div class="pzp-pc__video">',
    `<video class="webplayer-internal-video"${source}></video>`,
    '</div>',
    '</div>'
  ].join('\n')
}

// 채팅 칸은 자식이 position: absolute다. 패널을 이 안에 넣으면 채팅에 가려진다.
// 그 상황을 픽스처에서도 재현해 둬야, 패널 자리를 여기로 되돌리면 e2e가 잡는다.
function buildAside() {
  return [
    '<aside id="vod-aside" class="_aside_z51yg_32" style="position: relative">',
    '<div class="_container_189hq_2" style="position: absolute; inset: 0; background: #141517"></div>',
    '</aside>'
  ].join('\n')
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

// 치지직은 긴 댓글의 뒷부분을 DOM에서 잘라내고 끝에 더보기 버튼을 둔다. 잘린 부분은 DOM에 없다.
// 펼치면 같은 노드의 본문이 늘어난다. 클릭 직후가 아니라 다음 마이크로태스크에 갱신되는 것까지
// 흉내 내야, 곧바로 읽는 구현이 픽스처 위에서만 통과하는 일이 없다. (2026-09-23 실측)
function buildComments(comments) {
  if (comments.length === 0) {
    return ''
  }

  return ['<div id="commentArea">', ...comments.map(buildCommentBox), '</div>', EXPAND_SCRIPT].join('\n')
}

function buildCommentBox({ lines = [], visibleCount = lines.length, nickname = '시청자' }, index) {
  const isCollapsed = visibleCount < lines.length
  const fullBody = lines.map(buildCommentLine).join('<br>')
  const visibleBody = lines.slice(0, visibleCount).map(buildCommentLine).join('<br>')
  const body = isCollapsed ? `${visibleBody}...${MORE_BUTTON}` : fullBody

  return [
    `<div id="commentBox-${index + 1}" class="_wrap_19chc_1">`,
    '<div class="_header_19chc_66">',
    // 닉네임도 클래스가 _text_로 시작한다. 본문만 골라내지 못하면 여기에도 띠가 붙는다.
    `<button class="_information_19chc_101"><strong class="_name_19chc_122">`,
    `<span class="_text_1iatj_2">${escapeHtml(nickname)}</span></strong></button>`,
    '</div>',
    '<div class="_content_19chc_40">',
    `<div class="_text_19chc_193" data-full="${escapeHtml(fullBody)}">${body}</div>`,
    '</div>',
    '</div>'
  ].join('\n')
}

// 치지직은 시각을 버튼으로 감싼다. 줄바꿈은 <br>이라 innerText에서만 줄로 보인다.
function buildCommentLine(line) {
  const [timestampText, ...rest] = line.split(' ')

  return `<button class="_time_19chc_108">${escapeHtml(timestampText)}</button> ${escapeHtml(rest.join(' '))}`
}

const MORE_BUTTON = '<button type="button" class="_button_more_19chc_53">더보기</button>'

const EXPAND_SCRIPT = [
  '<script>',
  "document.addEventListener('click', (event) => {",
  "  const button = event.target.closest('[class^=\"_button_more_\"]')",
  '  if (button === null) { return }',
  "  const body = button.closest('[class^=\"_text_\"]')",
  '  Promise.resolve().then(() => { body.innerHTML = body.dataset.full })',
  '}, true)',
  '</script>'
].join('\n')
