import { readFileSync } from 'node:fs'

import { PLATFORM_PROFILES } from '../../src/adapters/platformProfiles.js'
import { test, expect } from './liveContext.js'

// 유튜브는 색 변수 이름을 바꾼 적이 있다(--yt-spec-* → --yt-sys-color-baseline--*). 그때 변수가
// 빈 값이 되어 대체값인 라이트 색이 다크 테마에 그대로 쓰였다. 픽스처에는 유튜브 스타일이 없어서
// 이 변화를 잡을 수 없다. 이름이 오늘도 유효한지는 이 파일만이 답한다.
const TOKENS_URL = new URL('../../src/ui/styles/tokens.youtube.css', import.meta.url)

// PREF 쿠키의 f6=400이 유튜브 다크 테마다. 라이트는 변수가 없어도 대체값이 맞아 보여 문제가 가려진다.
const DARK_THEME_COOKIE = { name: 'PREF', value: 'f6=400', domain: '.youtube.com', path: '/' }

test.describe('실제 유튜브 테마 변수', () => {
  test('유튜브가 tokens.css가 가리키는 색 변수를 다크 테마에서 모두 정의한다', async ({ extensionContext, openWatchPage }) => {
    await extensionContext.addCookies([DARK_THEME_COOKIE])
    const { page } = await openWatchPage()
    await expect(page.locator(PLATFORM_PROFILES.youtube.selectors.panelContainer).first()).toBeAttached()
    const names = [...readFileSync(TOKENS_URL, 'utf8').matchAll(/var\(\s*(--yt-[a-z0-9-]+)/g)].map((match) => match[1])

    const values = await page.evaluate(
      (variableNames) =>
        variableNames.map((name) => [name, getComputedStyle(document.documentElement).getPropertyValue(name).trim()]),
      names
    )

    expect(names.length).toBeGreaterThan(0)
    expect(values.filter(([, value]) => value === '')).toEqual([])
  })
})
