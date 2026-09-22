---
description: 버전을 올리는 PR을 만들고, 병합된 뒤 다시 부르면 태그와 GitHub 릴리스를 남긴다
argument-hint: [major]
---

인자: $ARGUMENTS

한 커맨드가 두 단계를 맡는다. 어느 단계인지는 상태를 보고 정한다.
PR 병합은 사람이 하므로, 병합을 기다리지 않고 두 번 부르는 구조다.

## 0. 단계 판별

`git fetch --tags --prune origin` 후 `origin/main`의 `manifest.json` `version`을 읽는다 (`V`).

- 태그 `vV`가 없다 → **B. 마무리**
- 태그 `vV`가 있다 → **A. 준비**

## A. 준비 — 버전을 올리는 PR까지

1. 마지막 태그: `git describe --tags --abbrev=0 origin/main`

2. 그 뒤에 병합된 PR을 모은다.
   `git log <태그>..origin/main --merges --first-parent --format=%s` 에서
   `Merge pull request #N` 의 N을 뽑고, `gh pr view N --json number,title,labels,headRefName`.
   `release/` 브랜치의 PR은 뺀다.

3. type 라벨이 정확히 하나가 아닌 PR이 있으면 **멈추고 목록을 보여준다.** 추측해서 분류하지 않는다.

4. 다음 버전을 정한다.
   - 인자가 `major` → major를 올린다. 자동으로는 major를 올리지 않는다
   - `feat`가 하나라도 있다 → minor (`1.0.0` → `1.1.0`)
   - `fix`가 있다 → patch (`1.0.0` → `1.0.1`)
   - 둘 다 없다 → 릴리스할 것이 없다고 말하고 끝낸다

5. 릴리스 노트 초안을 만든다. 이 글이 PR 본문이자 GitHub 릴리스 본문이 된다.
   ```
   ## 새 기능
   - <PR 제목> (#N)
   ## 버그 수정
   - <PR 제목> (#N)
   ## 그 외
   - <PR 제목> (#N)     (refactor · test · docs · chore)
   ```
   비어 있는 절은 뺀다.

6. **다음 버전과 노트를 보여주고 멈춘다.** 이 단계의 유일한 승인 지점이다.

7. (승인 후) `origin/main`에서 `release/v<새 버전>` 브랜치를 만든다.
   릴리스에는 이슈가 없어서 `<type>/#<이슈번호>` 규칙의 예외다.

8. `manifest.json`의 `version`만 바꾼다. 다른 파일은 건드리지 않는다.
   커밋 `chore: v<새 버전> 릴리스`, 푸시.

9. `gh pr create --label chore --title "v<새 버전> 릴리스" --body-file` 로 PR을 만든다.
   본문은 5의 노트다. 병합하지 않는다.

10. 보고: PR 링크, 그리고 "병합한 뒤 `/release`를 다시 부르라"는 안내.

## B. 마무리 — 태그, 릴리스, 스토어용 zip

1. 이 버전의 릴리스 PR을 찾는다.
   `gh pr list --state merged --head release/vV --json number,body,mergeCommit`
   없으면 멈추고 말한다. 버전이 PR 없이 바뀐 것이다.

2. 태그와 릴리스를 한 번에 만든다. 태그는 PR의 병합 커밋에 붙는다.
   `gh release create vV --target <병합 커밋 sha> --title vV --notes-file <PR 본문>`

3. 스토어에 올릴 zip을 태그에서 만든다. 작업 폴더가 아니라 태그에서 만들어야
   커밋 안 한 파일이 섞이지 않는다.
   `git archive --format=zip -o <스크래치패드>/timeline-skipper-vV.zip vV manifest.json icons src`

4. `gh release upload vV <zip>` 으로 릴리스에 첨부한다.

5. 보고: 릴리스 링크, zip 경로, 그리고 사람이 할 일
   — 크롬 웹 스토어 개발자 대시보드에 zip을 올리고 심사를 제출한다.
