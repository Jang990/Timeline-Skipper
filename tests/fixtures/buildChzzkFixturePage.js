// 치지직 다시보기 페이지를 통째로 저장하지 않는 이유는 유튜브 픽스처와 같다 —
// 저장본은 자기 JS가 다시 돌면서 판을 깨뜨린다. 확장이 읽는 자리만 세운다.
//
// 아래 구조는 2026-09-23 실제 다시보기 페이지에서 확인했다.
// 클래스 뒤의 해시는 치지직 빌드가 붙인 것이다. 확장은 이름 앞부분만 맞춰야 하므로
// 픽스처에도 해시를 남겨 둔다. 해시를 빼면 앞부분만 맞추는지 검증하지 못한다.
export function buildChzzkFixturePage({ videoSourceUrl = null } = {}) {
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
