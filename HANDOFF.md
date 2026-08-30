# 타임라인 스킵 확장 — 인수인계

> 작성: 2026-08-27. 다음 작업 세션을 위한 문서.
> 프로젝트 규칙은 `CLAUDE.md`를 먼저 읽을 것. 이 문서는 진행 상황만 담는다.

## 현재 상태

**동작하는 것** (사람이 브라우저에서 확인 완료)

- 타임라인 댓글 자동 선택 → 오른쪽 패널에 트랙 목록
- 댓글마다 `↓ 타임라인 N개 불러오기` 버튼 → 누르면 목록에 추가
- 체크 해제한 구간 자동 스킵 (연속 해제 시 한 번에 점프)
- 목록의 시각 클릭 → 이동
- 영상별 저장 (목록·해제 상태·반복 설정), 영상 전환 시 교체
- 비우기

**테스트**: core 67개 전부 통과 (`npm test`). 빌드 없음.

**파일 구조**

```
manifest.json              MV3 / matches: youtube.com/* / permissions: ["storage"]
src/core/                  parseTimelineComment, buildTracks, findTrackAtTime,
                           findSkipTarget, findAdjacentTrack, findLoopTarget,
                           pickTimelineComment
src/adapters/              selectors, youtubePage, youtubePlayer, youtubeComments, storage
src/ui/                    panel.js (141줄), panel.css
src/content.js             조립 (145줄)
tests/core/                core 미러링, 7개 파일
```

## 아직 사람이 확인 안 한 것 ← 다음 세션에서 먼저

- [ ] `⏮ ▶ ⏭` 동작 (곡 중간 ⏮ = 그 곡 처음 / 3초 이내 ⏮ = 이전 곡 / 해제된 곡 건너뛰기)
- [ ] `🔁` 반복 (마지막 곡 끝 → 첫 곡, 영상별 저장, 다른 영상에 안 딸려감)
- [ ] **여러 댓글 합치기** — 한 번도 시도 안 됨. 댓글 + 대댓글에 나뉜 타임라인이 원래 요구사항이었음
- [ ] **대댓글에 버튼이 붙는지** — 셀렉터가 `ytd-comment-thread-renderer #content-text`라 답글을 펼치면 자동으로 붙을 것으로 **추정**되나 미확인

## 남은 작업

### 1. 직접 추가 / 제목 수정 (원래 요구사항, 다음 순서)

저장 구조가 이미 `entries: [{ timestampSeconds, title }]`라 얹기 좋다.
트랙 식별은 현재 `startSeconds`가 키 — 사용자가 시작 시각을 수정하면 그 트랙의 체크 상태가
초기화되는 문제가 있다. `id` 도입 여부를 먼저 정할 것.

### 2. 자가진단 (권장, 저비용)

지금은 셀렉터가 아무것도 못 찾아도 패널이 **조용히** 비어 있다. 유튜브 마크업이 바뀌면
사용자는 "타임라인 댓글이 없나 보다"로 오해한다. 아래를 구분해 표시할 것.

- 영상 요소를 못 찾음
- 댓글이 아직 안 불러와짐
- 타임라인이 있는 댓글이 없음

### 3. 테스트 자동화 (미결정 — 논의만 하고 끝남)

- 실제 유튜브 페이지 HTML 스냅샷(`document.documentElement.outerHTML`)을 픽스처로 쓰고
  Playwright로 진짜 크롬에 확장 로드
- 손으로 만든 가짜 픽스처는 "만든 사람의 가정"을 검증할 뿐이라 기각됨 (`\r\n` 버그가 실제 사례)
- 걸림돌: 스냅샷 개인정보 검수 필요, `<video>`는 스텁 불가피, 개발 의존성 + 크롬 150MB
- `CLAUDE.md`의 "adapters/ui는 자동 테스트를 요구하지 않는다"와 충돌 → 문서도 같이 고쳐야 함

### 4. 소소한 것

- 버튼의 개수 표시가 **중복 제거 전** 숫자 (같은 시각이 두 번 적힌 댓글에서 `4개`라 뜨고
  실제로는 2개 들어감)
- `✓ 불러옴` 버튼 상태가 새로고침 후 유지 안 됨 (다시 눌러도 중복 제거되어 목록은 안 망가짐)
- 반복 설정이 **영상별** 저장 — 전역이 나을지 미결정
- 파서를 개선해도 이미 저장된 영상은 재파싱 안 됨 (비우고 다시 불러와야 함)

### 5. 나중에

치지직 · 숲 어댑터. `core/`는 이미 플랫폼 중립이라 `adapters/`만 추가하면 된다.

## 이미 정해진 것 (다시 논의 불필요)

| 항목 | 결정 |
|---|---|
| 제목의 트랙 번호 (`01.`) | 그대로 둔다 |
| 댓글 선택 | 댓글마다 버튼, 불러오기 = **추가**(합치기), 비우기 버튼 별도 |
| `⏮` 규칙 | 3초 넘게 재생 → 그 곡 처음 / 이내 → 이전 곡 |
| 컨트롤 위치 | 패널 상단 (플레이어 컨트롤 바 아님) |
| 저장소 | `chrome.storage.local`, 키 `video:<videoId>`, 저장 단위는 파싱된 `entries` |
| 자동 선택 | 타임라인 줄 3개 이상 중 최다인 댓글, 1회만. 비우기 후에는 다시 안 함 |
| 권한 | `matches: youtube.com/*` + `storage` 승인됨. 그 외 추가는 재승인 필요 |

## 확인된 셀렉터 (개발자 도구로 실측, 2026-08-27)

```
video.html5-main-video        영상
#movie_player                 플레이어
#secondary-inner              패널 붙이는 자리
ytd-comment-thread-renderer   댓글 스레드
#content-text                 댓글 본문 (yt-attributed-string, 대댓글도 이 안에 있음)
```

댓글 본문 주변 구조:

```
ytd-comment-view-model#comment
  div#body
    div#main
      ytd-expander#expander
        div#content            ← overflow: hidden
          yt-attributed-string (#content-text)
```

## 함정 (재발 방지)

- **댓글 본문의 줄바꿈이 `\r\n`인 경우가 있다.** JS 정규식에서 `.`은 `\r`를 매치하지 않아서,
  시각이 앞에 오는 형식이 전부 조용히 실패했다. `parseTimelineComment`가 `/\r\n|\r|\n/`로 자른다.
- **줄 끝 시각(`곡명 3:12`)에서 제목을 욕심껏 잡으면** `곡 1:02:33`이 제목 `곡 1:0` +
  시각 `2:33`으로 쪼개진다. non-greedy 필수.
- 유튜브 댓글은 지연 로딩 → `MutationObserver`로 계속 감시
  (`youtubePage.onPageChanged`, 300ms 디바운스). 핸들러는 멱등이어야 한다.
- `timeupdate` / `play` / `pause`는 **버블링하지 않는다** → `document`에 캡처 단계로 등록.
- 댓글 본문은 남이 쓴 문자열 → 항상 `textContent`. `innerHTML` 금지.
- 브라우저 확인은 사람만 할 수 있다. "동작합니다"라고 단정하지 말고 무엇이 테스트로
  검증됐고 무엇이 미확인인지 구분해서 보고할 것.
