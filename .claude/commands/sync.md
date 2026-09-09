---
description: main과 현재 브랜치를 최신화하고 병합이 끝난 브랜치를 지운다
allowed-tools: Bash(git:*)
---

`origin/main` 을 기준으로 로컬 저장소를 정리한다.
원격 브랜치와 워크트리는 건드리지 않는다.

## 1. 가져오기

`git fetch --prune origin`

## 2. 최신화 — `main` 과 현재 브랜치, 이 둘만

다른 워크트리가 물고 있는 브랜치는 손대지 않는다. 남의 작업 공간이다.

- **현재 브랜치** → `git merge --ff-only @{u}`
- **main** → `git worktree list --porcelain` 으로 어디 있는지 보고 갈린다.
  - 아무 데도 없음 → `git fetch origin main:main`
  - 지금 이 워크트리 → `git merge --ff-only origin/main`
  - 다른 워크트리 → `git -C <경로> merge --ff-only origin/main`

  체크아웃된 브랜치로는 fetch 가 거부당하기 때문에 `main` 만 경우를 나눈다.

아래에 해당하면 **건너뛰고 이유를 말한다.** 강제하지 않는다.

- 그 폴더에 커밋 안 한 변경이 있다 (`git -C <경로> status --porcelain` 이 비어있지 않다)
- fast-forward 가 아니다 (로컬에만 있는 커밋이 있다)
- upstream 이 없거나 사라졌다

## 3. 지울 후보 고르기

`git branch --merged origin/main` 에서 아래를 뺀다.

- `main`
- 현재 브랜치
- 워크트리가 물고 있는 브랜치 (`git branch --format='%(refname:short) %(worktreepath)'`)
- `worktree-` 로 시작하는 브랜치

## 4. 멈추기

후보를 마지막 커밋 요약과 함께 출력하고 멈춘다.
승인 전에는 아무것도 지우지 않는다.

## 5. 삭제

브랜치마다 `git merge-base --is-ancestor <브랜치> origin/main` 으로 확인하고
`git branch -d <브랜치>`. `-d` 가 거부하면 `-D` 를 쓴다.

`-d` 는 현재 HEAD 와 upstream 만 보기 때문에, `origin/main` 에 들어갔지만
지금 HEAD 히스토리엔 없는 브랜치를 거부한다. `-D` 는 ancestor 확인을 통과한
브랜치에만 쓴다. 확인이 실패하면 손대지 않는다.

## 6. 보고

- `main` 과 현재 브랜치가 어디서 어디로 갔는지. 건너뛴 것은 그 이유
- 지운 브랜치
- 남긴 브랜치와 이유

squash·rebase 로 머지된 브랜치는 `--merged` 에 잡히지 않는다.
이 저장소는 merge 커밋을 쓰므로 해당 없다.
