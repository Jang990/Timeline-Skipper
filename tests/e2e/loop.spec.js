import { test, expect } from '../fixtures/extensionContext.js'
import { readCommentSnapshot } from '../fixtures/snapshots/commentSnapshot.js'

// 트랙 시작은 1, 269, 556, 810, 1026, 1253, 1508, 1795초이고, 마지막 트랙은 영상 끝에서 끝난다.
const { commentTexts } = readCommentSnapshot('3yG8GXdnEFQ')

// 같은 버튼이 플로팅 위젯에도 있다. 위젯 쪽은 floating.spec.js가 다루므로 여기서는 패널로 좁힌다.
const PANEL = '#timeline-skip-panel'
const ROW = `${PANEL} .timeline-skip-row`
const LOOP_ON_BUTTON = `${PANEL} [aria-label="반복 켜기"]`
const LOOP_OFF_BUTTON = `${PANEL} [aria-label="반복 끄기"]`

test.describe('반복 재생', () => {
  // 마지막 트랙의 끝이 곧 영상의 끝이다. 영상이 멈추는 그 순간에 되감기가 일어나야 한다.
  test('반복을 켜고 재생하면 마지막 트랙이 끝날 때 첫 트랙 시작으로 돌아간다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await turnOnLoop(page)
    await seekAndSettle(page, 1797)

    await page.evaluate(() => document.querySelector('video').play())

    await expect.poll(() => readCurrentTimeSeconds(page), { timeout: 10_000 }).toBeLessThan(10)
  })

  // 유튜브는 영상을 끝낼 때 재생 시각이 끝에 닿지 않은 채 멈추고 플레이어에 종료 표시만 붙인다.
  // 그 모습을 그대로 흉내 낸다. 돌아간 것만 보면 멈춰 선 것도 통과하므로 시각이 흘러가는지까지 본다.
  test('플레이어에 종료 표시가 붙으면 첫 트랙 시작으로 돌아가 이어서 재생한다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await turnOnLoop(page)
    await seekAndSettle(page, 1000)
    await page.evaluate(() => document.querySelector('video').play())
    await expect.poll(() => readCurrentTimeSeconds(page)).toBeGreaterThan(1000.3)

    await page.evaluate(() => {
      document.querySelector('video').pause()
      document.querySelector('#movie_player').classList.add('ended-mode')
    })

    await expect.poll(() => readCurrentTimeSeconds(page), { timeout: 10_000 }).toBeLessThan(10)
    await expect.poll(() => readCurrentTimeSeconds(page), { timeout: 10_000 }).toBeGreaterThan(1.5)
    expect(await page.evaluate(() => document.querySelector('video').paused)).toBe(false)
  })

  test('반복 상태는 새로고침한 뒤에도 유지된다', async ({ openWatchPage }) => {
    const { page } = await openWatchPage({ commentTexts })
    await loadTimeline(page)
    await turnOnLoop(page)

    await reloadWatchPage(page)

    await expect(page.locator(LOOP_OFF_BUTTON)).toHaveClass(/is-active/)
  })
})

// 영상 길이를 모르는 채로 불러오면 마지막 트랙의 끝이 비어 있다. 길이를 안 뒤에 불러온다.
async function loadTimeline(page) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.locator('.timeline-skip-load-button').first().click()
  await expect(page.locator(ROW).first()).toBeVisible()
}

async function turnOnLoop(page) {
  await page.locator(LOOP_ON_BUTTON).click()
  await expect(page.locator(LOOP_OFF_BUTTON)).toBeVisible()
}

// 저장은 끝나기를 기다려 주지 않는다. 목록이 되살아난 것을 본 다음에 검증해야
// 저장이 늦은 것과 상태가 틀린 것이 구분된다.
async function reloadWatchPage(page) {
  await page.reload()
  await expect(page.locator(ROW).first()).toBeVisible()
}

// 되감기는 timeupdate를 받아서 일어난다. 이벤트를 기다리지 않고 읽으면 "제자리에 있다"는 단언이 기다림 없이
// 초록이 된다. 확장은 document에서 캡처로 듣기 때문에 video에 단 이 리스너가 불릴 때는
// 확장의 처리가 이미 끝나 있다.
function seekAndSettle(page, timestampSeconds) {
  return page.evaluate(
    (seconds) =>
      new Promise((resolve) => {
        const video = document.querySelector('video')

        video.addEventListener('timeupdate', () => resolve(video.currentTime), { once: true })
        video.currentTime = seconds
      }),
    timestampSeconds
  )
}

function readCurrentTimeSeconds(page) {
  return page.evaluate(() => document.querySelector('video').currentTime)
}
