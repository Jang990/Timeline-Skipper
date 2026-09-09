// 위젯을 어떤 모습으로 둘지는 사람마다 다르고, 한 번 정하면 잘 바꾸지 않는다.
// 그래서 영상이 아니라 설정에 저장되고, 저장된 값은 다음에 그대로 돌아온다.
//
// 보임과 크기는 서로 다른 버튼이 다룬다. 값 하나로 합치면 한쪽을 바꿀 때 다른 쪽이 함께
// 덮여서, 펼쳐둔 채 숨긴 위젯이 접힌 모습으로 되돌아온다. 숨기기의 반대는 원상복구다.

// 저장된 값은 예전 버전이 쓰던 것일 수도, 사람이 직접 고친 것일 수도 있다.
// 참이라고 분명히 적힌 것만 참으로 본다. 나머지는 전부 기본값(보이는 접힘)이 된다.
export function toValidSettings(stored) {
  return {
    floatingHidden: stored?.floatingHidden === true,
    floatingExpanded: stored?.floatingExpanded === true
  }
}
