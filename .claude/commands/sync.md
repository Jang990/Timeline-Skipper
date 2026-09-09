---
description: main을 최신화하고 병합이 끝난 로컬 브랜치를 지운다
allowed-tools: Bash(git:*)
---

`origin/main` 을 기준으로 로컬 저장소를 정리한다. 원격 브랜치는 건드리지 않는다.

1. `git fetch --prune origin`

2. 로컬 `main` 을 `origin/main` 까지 fast-forward 한다.
   `git worktree list --porcelain` 으로 `main` 이 어디에 체크아웃돼 있는지 보고 방법이 갈린다.
   - 아무 데도 없음 → `git fetch origin main:main`
   - 지금 이 워크트리 → `git merge --ff-only origin/main`
   - 다른 워크트리 → 그 경로가 깨끗할 때만 `git -C <경로> merge --ff-only origin/main`.
     `git -C <경로> status --porcelain` 에 뭔가 있으면 건너뛰고 이유를 말한다.

   체크아웃된 브랜치로는 fetch 가 거부당하기 때문에 경우를 나눈다.
   fast-forward 가 안 되면(로컬 `main` 에만 있는 커밋) 멈추고 보고한다. 강제하지 않는다.

3. 지울 후보를 뽑는다. `git branch --merged origin/main` 에서 아래를 뺀다.
   - `main`
   - 현재 체크아웃된 브랜치
   - 워크트리가 점유한 브랜치 (`git branch --format='%(refname:short) %(worktreepath)'`)

4. 후보를 마지막 커밋 요약과 함께 출력하고 멈춘다. 이 사이클의 유일한 승인 지점이다.

5. 승인 후 삭제한다. 브랜치마다 `git merge-base --is-ancestor <브랜치> origin/main` 로
   한 번 더 확인하고 `git branch -d <브랜치>`.
   `-d` 가 거부하면 `-D` 를 쓴다. `-d` 는 현재 HEAD 와 upstream 만 보기 때문에,
   `origin/main` 에 들어갔지만 지금 HEAD 히스토리엔 없는 브랜치를 거부한다.
   `-D` 는 ancestor 확인을 통과한 브랜치에만 쓴다. 확인이 실패하면 손대지 않는다.

6. 보고한다.
   - `main` 이 어디서 어디로 갔는지
   - 지운 브랜치
   - 남긴 브랜치와 그 이유 (현재 브랜치 / 워크트리 점유 / 미머지)

원격 브랜치는 지우지 않는다. 워크트리는 제거하지 않는다.
squash·rebase 로 머지된 브랜치는 `--merged` 에 잡히지 않는다.
이 저장소는 merge 커밋을 쓰므로 해당 없다.
