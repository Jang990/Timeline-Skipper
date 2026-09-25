import { test, expect } from '../fixtures/extensionContext.js'

const LONG_TITLE = '아주 길어서 위젯의 폭을 훌쩍 넘어가고도 한참 남는 제목을 가진 두 번째 곡'
const TIMELINE_COMMENT = ['00:00 첫 곡', `05:00 ${LONG_TITLE}`].join('\n')

const FLOATING = '#timeline-skip-floating'
const TITLE = `${FLOATING} .timeline-skip-floating-title`
const TITLE_TEXT = `${TITLE} .timeline-skip-floating-title-text`

// 글꼴마다 글자 폭이 달라서, 조금 잘린 제목은 칸을 글자보다 이만큼 좁혀 만든다.
const SLIGHT_OVERFLOW_PIXELS = 3
const SAMPLE_STEP_MILLISECONDS = 50
const ALLOWED_DEPARTURE_GAP_MILLISECONDS = 100
const MAXIMUM_SLIGHT_SCROLL_MILLISECONDS = 1000
const SPEED_RANGE_PIXELS_PER_SECOND = [20, 28]

// 기다리며 재면 기계가 바쁠 때 흔들린다. 애니메이션을 세워 두고 재생 시각을 옮겨 가며 글자 자리를 읽는다.
test('제목은 길이와 상관없이 같은 시간 멈췄다 출발하고, 조금 잘려도 1초 안에 끝까지 밀리며, 길면 초당 24px 안팎으로 흐른다', async ({ openWatchPage }) => {
  const { page } = await openWatchPage({ commentTexts: [TIMELINE_COMMENT] })
  await page.locator('.timeline-skip-load-button').first().click()
  await page.locator(`${FLOATING} .timeline-skip-floating-icon`).click()

  await narrowTitleBelowText(page)
  const slight = await readMotion(page)

  await seekTo(page, 400)
  await expect(page.locator(TITLE)).toHaveText(LONG_TITLE)
  const long = await readMotion(page)

  expect(slight.overflowPixels).toBe(SLIGHT_OVERFLOW_PIXELS)
  expect(Math.abs(slight.departureMilliseconds - long.departureMilliseconds)).toBeLessThanOrEqual(ALLOWED_DEPARTURE_GAP_MILLISECONDS)
  expect(slight.arrivalMilliseconds - slight.departureMilliseconds).toBeLessThanOrEqual(MAXIMUM_SLIGHT_SCROLL_MILLISECONDS)
  expect(long.middleSpeedPixelsPerSecond).toBeGreaterThanOrEqual(SPEED_RANGE_PIXELS_PER_SECOND[0])
  expect(long.middleSpeedPixelsPerSecond).toBeLessThanOrEqual(SPEED_RANGE_PIXELS_PER_SECOND[1])
})

async function narrowTitleBelowText(page) {
  await page.evaluate(({ titleSelector, overflowPixels }) => {
    const title = document.querySelector(titleSelector)
    const textWidth = title.firstElementChild.scrollWidth
    title.style.maxWidth = `${textWidth - overflowPixels}px`
  }, { titleSelector: TITLE, overflowPixels: SLIGHT_OVERFLOW_PIXELS })

  await expect(page.locator(TITLE)).toHaveClass(/is-scrolling/)
}

// 출발은 글자가 처음 움직인 때, 도착은 끝 위치에 닿은 때, 가운데 속도는 4분의 1 지점에서 4분의 3 지점까지로 잰다.
async function readMotion(page) {
  await expect.poll(() => page.evaluate((selector) => document.querySelector(selector).getAnimations().length, TITLE_TEXT)).toBeGreaterThan(0)

  return page.evaluate(({ titleSelector, textSelector, stepMilliseconds }) => {
    const title = document.querySelector(titleSelector)
    const text = document.querySelector(textSelector)
    const overflowPixels = text.scrollWidth - title.clientWidth
    const [animation] = text.getAnimations()
    const cycleMilliseconds = animation.effect.getComputedTiming().duration
    const samples = []

    animation.pause()

    for (let time = 0; time <= cycleMilliseconds; time += stepMilliseconds) {
      animation.currentTime = time
      samples.push({ time, shift: -new DOMMatrix(getComputedStyle(text).transform).m41 })
    }

    const firstReaching = (pixels) => samples.find((sample) => sample.shift >= pixels).time
    const quarter = firstReaching(overflowPixels / 4)
    const threeQuarters = firstReaching((overflowPixels * 3) / 4)

    return {
      overflowPixels,
      departureMilliseconds: firstReaching(0.1),
      arrivalMilliseconds: firstReaching(overflowPixels - 0.1),
      middleSpeedPixelsPerSecond: (overflowPixels / 2) / ((threeQuarters - quarter) / 1000)
    }
  }, { titleSelector: TITLE, textSelector: TITLE_TEXT, stepMilliseconds: SAMPLE_STEP_MILLISECONDS })
}

async function seekTo(page, timestampSeconds) {
  await expect
    .poll(() => page.evaluate(() => document.querySelector('video').readyState))
    .toBeGreaterThanOrEqual(1)

  await page.evaluate((seconds) => {
    document.querySelector('video').currentTime = seconds
  }, timestampSeconds)
}
