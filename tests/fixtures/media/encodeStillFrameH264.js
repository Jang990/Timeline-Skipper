// ffmpeg 없이 만들 수 있는 가장 단순한 H.264 프레임을 낸다.
// I_PCM 매크로블록은 예측도 변환도 엔트로피 부호화도 없이 화소값을 그대로 싣기 때문에,
// 인코더 없이 손으로 조립할 수 있는 유일한 매크로블록 종류다.
// 화소값을 0x80(회색)으로 고정한 이유: 0x00 바이트가 없어야 emulation prevention(0x000003)
// 삽입 규칙을 신경 쓰지 않아도 된다.
const GRAY = 0x80
const MACROBLOCK_LUMA_BYTES = 256
const MACROBLOCK_CHROMA_BYTES = 128

export const FRAME_WIDTH = 16
export const FRAME_HEIGHT = 16

class BitWriter {
  constructor () {
    this.bytes = []
    this.current = 0
    this.bitCount = 0
  }

  bit (value) {
    this.current = (this.current << 1) | value

    if (++this.bitCount === 8) {
      this.bytes.push(this.current)
      this.current = 0
      this.bitCount = 0
    }
  }

  u (bitLength, value) {
    for (let index = bitLength - 1; index >= 0; index--) {
      this.bit((value >> index) & 1)
    }
  }

  // Exp-Golomb. 0은 비트 1 하나, 1~2는 3비트, ... 로 커진다.
  ue (value) {
    const shifted = value + 1
    const bitLength = 32 - Math.clz32(shifted)

    this.u(bitLength - 1, 0)
    this.u(bitLength, shifted)
  }

  se (value) {
    this.ue(value <= 0 ? -2 * value : 2 * value - 1)
  }

  align () {
    while (this.bitCount !== 0) {
      this.bit(0)
    }
  }

  // rbsp_trailing_bits: 1을 하나 쓰고 0으로 바이트를 채운다.
  stop () {
    this.bit(1)
    this.align()
  }

  pushBytes (buffer) {
    for (const byte of buffer) {
      this.bytes.push(byte)
    }
  }

  toBuffer () {
    return Buffer.from(this.bytes)
  }
}

export function buildSequenceParameterSet () {
  const writer = new BitWriter()

  writer.u(8, 0x67) // NAL: nal_ref_idc=3, type=7(SPS)
  writer.u(8, 66) // profile_idc: baseline
  writer.u(8, 0) // constraint flags
  writer.u(8, 30) // level_idc: 3.0
  writer.ue(0) // seq_parameter_set_id
  writer.ue(0) // log2_max_frame_num_minus4
  writer.ue(2) // pic_order_cnt_type: 2 (표시 순서 = 복호 순서)
  writer.ue(1) // max_num_ref_frames
  writer.u(1, 0) // gaps_in_frame_num_value_allowed_flag
  writer.ue(FRAME_WIDTH / 16 - 1) // pic_width_in_mbs_minus1
  writer.ue(FRAME_HEIGHT / 16 - 1) // pic_height_in_map_units_minus1
  writer.u(1, 1) // frame_mbs_only_flag
  writer.u(1, 1) // direct_8x8_inference_flag
  writer.u(1, 0) // frame_cropping_flag
  writer.u(1, 0) // vui_parameters_present_flag
  writer.stop()

  return writer.toBuffer()
}

export function buildPictureParameterSet () {
  const writer = new BitWriter()

  writer.u(8, 0x68) // NAL: nal_ref_idc=3, type=8(PPS)
  writer.ue(0) // pic_parameter_set_id
  writer.ue(0) // seq_parameter_set_id
  writer.u(1, 0) // entropy_coding_mode_flag: CAVLC
  writer.u(1, 0) // bottom_field_pic_order_in_frame_present_flag
  writer.ue(0) // num_slice_groups_minus1
  writer.ue(0) // num_ref_idx_l0_default_active_minus1
  writer.ue(0) // num_ref_idx_l1_default_active_minus1
  writer.u(1, 0) // weighted_pred_flag
  writer.u(2, 0) // weighted_bipred_idc
  writer.se(0) // pic_init_qp_minus26
  writer.se(0) // pic_init_qs_minus26
  writer.se(0) // chroma_qp_index_offset
  writer.u(1, 0) // deblocking_filter_control_present_flag
  writer.u(1, 0) // constrained_intra_pred_flag
  writer.u(1, 0) // redundant_pic_cnt_present_flag
  writer.stop()

  return writer.toBuffer()
}

export function buildIdrSlice () {
  const writer = new BitWriter()

  writer.u(8, 0x65) // NAL: nal_ref_idc=3, type=5(IDR)
  writer.ue(0) // first_mb_in_slice
  writer.ue(7) // slice_type: I (픽처의 모든 슬라이스가 I)
  writer.ue(0) // pic_parameter_set_id
  writer.u(4, 0) // frame_num
  writer.ue(0) // idr_pic_id
  writer.u(1, 0) // no_output_of_prior_pics_flag
  writer.u(1, 0) // long_term_reference_flag
  writer.se(0) // slice_qp_delta
  writer.ue(25) // mb_type: I_PCM
  writer.align() // pcm_alignment_zero_bit
  writer.pushBytes(Buffer.alloc(MACROBLOCK_LUMA_BYTES + MACROBLOCK_CHROMA_BYTES, GRAY))
  writer.stop()

  return writer.toBuffer()
}
