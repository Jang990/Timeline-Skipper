---
description: 바뀐 부품의 전후 모습을 찍어 세션 스크래치패드에 남긴다
argument-hint: [바뀐 부품 설명]
---

찍을 것: $ARGUMENTS

사람이 눈으로 보려고 찍는다. 저장소에는 아무것도 남기지 않고, PR 에 올리지도
올리라고 안내하지도 않는다. 이슈나 PR 없이, 즉흥으로 고쳐본 것에도 부를 수 있다.

## 1. 이름과 자리

- 이름은 인자에서 부품을 가리키는 짧은 영문 한 덩어리로 짓는다 (`nowPlayingProgress`, `clearConfirm`).
  이슈·PR 번호를 쓰지 않는다. 번호가 없을 때도 불리는 커맨드다.
- 스크린샷 → `<스크래치패드>/screenshots/before_<이름>.png`, `after_<이름>.png`
- 캡처 스크립트 → `<스크래치패드>/capture/`
- 스크래치패드에 node_modules junction 을 만들지 않는다. 사람이 스크린샷을 열 때 탐색기가 멈춘다.

## 2. 캡처 스크립트

`<스크래치패드>/capture/` 에 두 파일을 만든다. `tests/` 에는 아무것도 만들지 않는다.

`capture.config.mjs`

```js
export default { testDir: '.', testMatch: '**/*.spec.mjs', workers: 1, reporter: 'list', timeout: 30000 }
```

`<이름>.spec.mjs` — 프로젝트 픽스처를 절대 경로 `file://` 로 불러 쓴다. 경로 구분자는 `/`,
한글 폴더명은 그대로 쓴다. 저장 이름은 `SHOT_LABEL` 로 갈라, 파일 하나로 before 와 after 를 다 찍는다.

```js
import { test, expect } from 'file:///<워크트리>/tests/fixtures/extensionContext.js'
import { readCommentSnapshot } from 'file:///<워크트리>/tests/fixtures/snapshots/commentSnapshot.js'

const LABEL = process.env.SHOT_LABEL ?? 'after'
const OUT = '<스크래치패드>/screenshots/' + LABEL + '_<이름>.png'
```

돌리기 — node_modules 가 거기 있으므로 워크트리 안에서 돈다.

```
npx playwright test --config <스크래치패드>/capture/capture.config.mjs
```

## 3. 무엇을 잘라 찍나

바뀐 요소만 딱 자르면 어디인지 알 수 없다. **그 요소가 속한 부품 전체**를 찍는다.
진행 바만 바꿨어도 제목부터 반복 버튼까지, 지금 재생 중 카드 전체.

- `boundingBox()` 로 범위를 재고 여백 12px 을 둘러 `page.screenshot({ clip })`.
  메뉴·시트처럼 떠 있는 것이 걸쳐 있으면 그것까지 감싼다.
- 찍기 직전에 `page.mouse.move(0, 0)`. 조작하느라 올려둔 커서의 hover 가 그림에 남는다.
- before 와 after 는 **같은 spec 파일로** 찍는다. 화면 크기나 클립 범위가 어긋나면 비교가 안 된다.

## 4. 순서

기준은 `git merge-base origin/main HEAD`. 작업 브랜치에서는 분기점이, main 위에서는
HEAD 가 잡혀서 어느 쪽이든 "이번 변경 직전"이 된다.

1. **after** — 지금 작업 트리 그대로 찍는다.
2. **백업** — 기준과 달라진 파일을 경로째 복사한다. 커밋 여부를 가리지 않고 지금 내용을 담는다.

   ```
   git diff --name-only <기준> -- src manifest.json | tee <백업>/files.txt | while read -r f; do
     [ -f "$f" ] && mkdir -p "<백업>/$(dirname "$f")" && cp "$f" "<백업>/$f"
   done
   ```
3. **되감기** — `git checkout <기준> -- src manifest.json`
4. **before** — 같은 spec 을 `SHOT_LABEL=before` 로 다시 돌린다.
5. **복구** — `git checkout HEAD -- src manifest.json` 으로 커밋된 상태를 세우고,
   백업을 그 위에 덮어써 커밋 안 한 변경까지 되돌린다.

   **복구는 촬영이 실패해도 반드시 한다.** 끝나면 `git status --porcelain` 이 2번 직전과
   같은지 확인하고, 다르면 무엇이 다른지 말한다.

before 를 구현 전에 이미 찍어뒀으면 2~5 를 건너뛴다.
새로 만든 부품이라 before 에 클립 잡을 것이 없으면 그 자리 전체를 찍고 그렇다고 말한다.

## 5. 보고

두 이미지를 보여주고 경로 한 줄. 다른 설명은 붙이지 않는다.
