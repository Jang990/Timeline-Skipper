// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import * as youtubePlayer from '../../src/adapters/youtubePlayer.js'
import * as storageAdapter from '../../src/adapters/storage.js'
import * as youtubePage from '../../src/adapters/youtubePage.js'
import * as youtubeComments from '../../src/adapters/youtubeComments.js'
import * as fullscreenAdapter from '../../src/adapters/fullscreen.js'
import { createFakePlayer } from '../fixtures/fakes/fakePlayer.js'
import { createFakeStorage } from '../fixtures/fakes/fakeStorage.js'
import { createFakeComments, createFakeFullscreen, createFakePage } from '../fixtures/fakes/fakePlatform.js'
import { settle, startWithFakes } from '../fixtures/fakes/startWithFakes.js'

const TIMELINE_COMMENT = ['00:01 첫 곡', '02:00 둘째 곡', '05:00 셋째 곡'].join('\n')
const ROW = '.timeline-skip-row'
const TITLE = `${ROW} .timeline-skip-title`

describe('가짜 어댑터', () => {
  it.each([
    ['플레이어', youtubePlayer, createFakePlayer()],
    ['저장소', storageAdapter, createFakeStorage()],
    ['페이지', youtubePage, createFakePage()],
    ['댓글', youtubeComments, createFakeComments()],
    ['전체화면', fullscreenAdapter, createFakeFullscreen()]
  ])('가짜 %s는 진짜 어댑터가 내보내는 함수를 모두 갖는다', (_name, realAdapter, fake) => {
    const realFunctionNames = Object.keys(realAdapter).filter((name) => typeof realAdapter[name] === 'function')

    const missingNames = realFunctionNames.filter((name) => typeof fake[name] !== 'function')

    expect(missingNames).toEqual([])
  })
})

describe('startWithFakes', () => {
  it('가짜 플레이어와 저장소로 시작하면 패널이 그려진다', async () => {
    const extension = await startWithFakes()

    expect(extension.findPanel()).not.toBeNull()
  })

  it('댓글에서 타임라인을 불러오면 트랙이 목록에 나온다', async () => {
    const extension = await startWithFakes()

    extension.comments.loadComment(TIMELINE_COMMENT)

    const titles = [...extension.findPanel().querySelectorAll(TITLE)].map((title) => title.textContent)
    expect(titles).toEqual(['첫 곡', '둘째 곡', '셋째 곡'])
  })

  it('꺼 둔 트랙의 구간에 이르면 다음 켜진 트랙의 시작으로 건너뛴다', async () => {
    const extension = await startWithFakes()
    extension.comments.loadComment(TIMELINE_COMMENT)
    extension.findPanel().querySelectorAll(`${ROW} input[type="checkbox"]`)[1].click()

    extension.player.playTo(130)

    expect(extension.player.seekHistory).toEqual([300])
  })

  it('같은 저장소로 다시 시작해도 불러온 목록과 꺼 둔 트랙이 남는다', async () => {
    const extension = await startWithFakes()
    extension.comments.loadComment(TIMELINE_COMMENT)
    extension.findPanel().querySelectorAll(`${ROW} input[type="checkbox"]`)[1].click()
    await settle()

    const restarted = await extension.restart()

    const rows = [...restarted.findPanel().querySelectorAll(ROW)]
    expect(rows).toHaveLength(3)
    expect(rows.map((row) => row.classList.contains('is-disabled'))).toEqual([false, true, false])
  })

  it('다시 시작하면 이전 패널은 남지 않고 하나만 그려진다', async () => {
    const extension = await startWithFakes()
    extension.comments.loadComment(TIMELINE_COMMENT)

    const restarted = await extension.restart()

    expect(document.querySelectorAll(`#${restarted.findPanel().id}`)).toHaveLength(1)
  })
})
