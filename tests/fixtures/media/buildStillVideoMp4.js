import {
  FRAME_WIDTH,
  FRAME_HEIGHT,
  buildSequenceParameterSet,
  buildPictureParameterSet,
  buildIdrSlice
} from './encodeStillFrameH264.js'

// 정지 화면 한 장으로 원하는 길이의 영상을 만든다.
// 샘플을 하나만 두면 중간 시각으로 탐색할 때 데이터가 없어 영상 끝으로 튄다(실측).
// 그래서 1초에 한 장씩 샘플을 두되, 청크 오프셋을 전부 같은 자리로 겹쳐서
// 실제 화면 데이터는 mdat에 한 장만 담는다. 늘어나는 건 stco 표뿐이다.
const TIMESCALE = 1000
const FRAME_INTERVAL_UNITS = TIMESCALE

const u16 = (value) => {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16BE(value)
  return buffer
}

const u32 = (value) => {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(value)
  return buffer
}

const fullBoxHeader = (flags) => Buffer.from([0, 0, 0, flags])

function box (type, ...parts) {
  const body = Buffer.concat(parts)
  const header = Buffer.alloc(8)

  header.writeUInt32BE(body.length + 8, 0)
  header.write(type, 4, 'latin1')

  return Buffer.concat([header, body])
}

// 회전·확대 없는 기본 변환 행렬. tkhd와 mvhd가 같은 값을 쓴다.
const IDENTITY_MATRIX = Buffer.concat([
  u32(0x10000), u32(0), u32(0),
  u32(0), u32(0x10000), u32(0),
  u32(0), u32(0), u32(0x40000000)
])

function buildSampleDescription () {
  const sps = buildSequenceParameterSet()
  const pps = buildPictureParameterSet()

  const avcC = box('avcC', Buffer.concat([
    // configurationVersion, profile, compatibility, level, lengthSizeMinusOne=3, spsCount=1
    Buffer.from([1, sps[1], sps[2], sps[3], 0xff, 0xe1]),
    u16(sps.length), sps,
    Buffer.from([1]), u16(pps.length), pps
  ]))

  const visualSampleEntry = Buffer.concat([
    Buffer.alloc(6), u16(1), // reserved, data_reference_index
    Buffer.alloc(16), // pre_defined / reserved
    u16(FRAME_WIDTH), u16(FRAME_HEIGHT),
    u32(0x00480000), u32(0x00480000), // 72dpi
    u32(0), u16(1), // reserved, frame_count
    Buffer.alloc(32), // compressorname
    u16(0x0018), Buffer.from([0xff, 0xff]) // depth, pre_defined = -1
  ])

  return box('stsd', fullBoxHeader(0), u32(1), box('avc1', visualSampleEntry, avcC))
}

function buildSampleTable (sampleLength, sampleCount, chunkOffset) {
  const chunkOffsets = Buffer.concat(Array.from({ length: sampleCount }, () => u32(chunkOffset)))

  return box('stbl',
    buildSampleDescription(),
    box('stts', fullBoxHeader(0), u32(1), u32(sampleCount), u32(FRAME_INTERVAL_UNITS)),
    box('stsc', fullBoxHeader(0), u32(1), u32(1), u32(1), u32(1)),
    box('stsz', fullBoxHeader(0), u32(sampleLength), u32(sampleCount)),
    box('stco', fullBoxHeader(0), u32(sampleCount), chunkOffsets)
  )
}

function buildMovie (sampleLength, sampleCount, chunkOffset) {
  const durationUnits = sampleCount * FRAME_INTERVAL_UNITS

  const mdia = box('mdia',
    box('mdhd', fullBoxHeader(0), u32(0), u32(0), u32(TIMESCALE), u32(durationUnits), u16(0x55c4), u16(0)),
    box('hdlr', fullBoxHeader(0), u32(0), Buffer.from('vide', 'latin1'), Buffer.alloc(12),
      Buffer.from('VideoHandler\0', 'latin1')),
    box('minf',
      box('vmhd', fullBoxHeader(1), Buffer.alloc(8)),
      box('dinf', box('dref', fullBoxHeader(0), u32(1), box('url ', fullBoxHeader(1)))),
      buildSampleTable(sampleLength, sampleCount, chunkOffset))
  )

  const tkhd = box('tkhd', fullBoxHeader(7), u32(0), u32(0), u32(1), u32(0), u32(durationUnits),
    Buffer.alloc(8), u16(0), u16(0), u16(0), u16(0), IDENTITY_MATRIX,
    u32(FRAME_WIDTH << 16), u32(FRAME_HEIGHT << 16))

  const mvhd = box('mvhd', fullBoxHeader(0), u32(0), u32(0), u32(TIMESCALE), u32(durationUnits),
    u32(0x00010000), u16(0x0100), u16(0), u32(0), u32(0), IDENTITY_MATRIX, Buffer.alloc(24), u32(2))

  return box('moov', mvhd, box('trak', tkhd, mdia))
}

export function buildStillVideoMp4 (durationSeconds) {
  const slice = buildIdrSlice()
  const sample = Buffer.concat([u32(slice.length), slice]) // avcC는 길이 접두 4바이트를 쓴다
  const sampleCount = durationSeconds

  const ftyp = box('ftyp', Buffer.from('isom', 'latin1'), u32(512),
    Buffer.from('isomiso2avc1mp41', 'latin1'))

  // stco에 적을 값이 moov 크기에 달려 있다. 크기는 오프셋과 무관하므로 두 번 만들면 정확해진다.
  const moovSize = buildMovie(sample.length, sampleCount, 0).length
  const moov = buildMovie(sample.length, sampleCount, ftyp.length + moovSize + 8)

  return Buffer.concat([ftyp, moov, box('mdat', sample)])
}
