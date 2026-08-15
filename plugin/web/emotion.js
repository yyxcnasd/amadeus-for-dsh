/* Amadeus 情绪/表情/动作映射表（统一调教入口） */
window.AmadeusEmotion = (function () {
  var EXPR = {
    happy: 'f01',
    excited: 'f01',
    elated: 'f01',
    question: 'f04',
    sad: 'f02',
    angry: 'f03',
    furious: 'f03',
    soft: 'f02',
    blush: 'f02',
    annoyed: 'f03',
    thinking: 'f04',
    surprised: 'f04',
    disappointed: 'f02',
    eyes_closed: '',
    indifferent: '',
    side: '',
    winking: 'f01',
    neutral: ''
  }

  var EXPR_TO_EMO = {
    f01: 'happy',
    f02: 'sad',
    f03: 'angry',
    f04: 'question',
    '': 'neutral'
  }

  // Cubism4 amadeusV1 无 expression 文件时，直接驱动这些参数
  var FACE = {
    happy:        { ParamEyeRSmile: 0.75, Param9: 0.45, ParamMouthForm: 0.45 },
    excited:      { ParamEyeRSmile: 0.85, Param9: 0.55, ParamMouthForm: 0.6 },
    elated:       { ParamEyeRSmile: 0.95, Param9: 0.65, ParamMouthForm: 0.7, ParamEyeBallX: 0.1 },
    sad:          { ParamEyeRSmile: -0.4, Param8: 0.3, ParamMouthForm: -0.35 },
    angry:        { ParamEyeRSmile: -0.6, Param8: 0.85, ParamMouthForm: 0.4, Param9: 0.2 },
    furious:      { ParamEyeRSmile: -0.8, Param8: 1.0, ParamMouthForm: 0.6, Param9: 0.3, ParamEyeBallY: -0.15 },
    question:     { Param8: 0.55, ParamEyeBallX: 0.16, ParamEyeBallY: 0.12, ParamMouthForm: 0.15 },
    soft:         { ParamEyeRSmile: 0.35, Param9: 0.18, ParamMouthForm: -0.15 },
    blush:        { Param9: 1.0, ParamEyeRSmile: 0.5, ParamMouthForm: -0.12 },
    annoyed:      { Param8: 0.7, ParamEyeRSmile: -0.4, ParamMouthForm: 0.25 },
    thinking:     { Param8: 0.55, ParamEyeBallX: -0.18, ParamEyeBallY: 0.22, ParamMouthForm: -0.2 },
    surprised:    { ParamEyeLOpen: 1, ParamEyeROpen: 1, ParamMouthOpenY: 0.55, Param8: 0.5 },
    disappointed: { ParamEyeRSmile: -0.35, Param8: 0.35, ParamMouthForm: -0.4 },
    eyes_closed:  { ParamEyeLOpen: 0, ParamEyeROpen: 0, ParamEyeRSmile: 0.1 },
    indifferent:  { ParamEyeLOpen: 0.65, ParamEyeROpen: 0.65, ParamMouthForm: -0.2 },
    side:         { ParamAngleY: 0.28, ParamAngleZ: -0.08, ParamEyeBallX: 0.3 },
    winking:      { ParamEyeLOpen: 1, ParamEyeROpen: 0, ParamEyeRSmile: 0.5 },
    neutral:      {}
  }

  // Cubism2 shizuku 骨架（本地 kurisu 模型）使用的参数名
  var C2_FACE = {
    happy:        { PARAM_EYE_SMILE: 0.7, PARAM_MOUTH_FORM: 0.4, PARAM_CHEEK: 0.35 },
    excited:      { PARAM_EYE_SMILE: 0.8, PARAM_MOUTH_FORM: 0.5, PARAM_CHEEK: 0.45 },
    elated:       { PARAM_EYE_SMILE: 0.9, PARAM_MOUTH_FORM: 0.6, PARAM_CHEEK: 0.55 },
    sad:          { PARAM_BROW_L_Y: 0.3, PARAM_BROW_R_Y: 0.3, PARAM_MOUTH_FORM: -0.3 },
    angry:        { PARAM_BROW_L_Y: -0.4, PARAM_BROW_R_Y: -0.4, PARAM_MOUTH_FORM: 0.3 },
    furious:      { PARAM_BROW_L_Y: -0.6, PARAM_BROW_R_Y: -0.6, PARAM_MOUTH_FORM: 0.5 },
    question:     { PARAM_BROW_L_Y: 0.2, PARAM_BROW_R_Y: 0.2, PARAM_ANGLE_X: -0.2 },
    soft:         { PARAM_EYE_SMILE: 0.3, PARAM_MOUTH_FORM: -0.1 },
    blush:        { PARAM_CHEEK: 1.0, PARAM_EYE_SMILE: 0.5, PARAM_MOUTH_FORM: -0.12 },
    annoyed:      { PARAM_BROW_L_Y: -0.3, PARAM_BROW_R_Y: -0.3, PARAM_MOUTH_FORM: -0.3 },
    thinking:     { PARAM_BROW_L_Y: 0.3, PARAM_BROW_R_Y: 0.3, PARAM_ANGLE_X: -0.3, PARAM_ANGLE_Z: 0.15 },
    surprised:    { PARAM_EYE_L_OPEN: 1, PARAM_EYE_R_OPEN: 1, PARAM_MOUTH_OPEN_Y: 0.6, PARAM_BROW_L_Y: -0.4 },
    disappointed: { PARAM_BROW_L_Y: 0.25, PARAM_BROW_R_Y: 0.25, PARAM_MOUTH_FORM: -0.4 },
    eyes_closed:  { PARAM_EYE_L_OPEN: 0, PARAM_EYE_R_OPEN: 0 },
    indifferent:  { PARAM_EYE_L_OPEN: 0.7, PARAM_EYE_R_OPEN: 0.7, PARAM_MOUTH_FORM: -0.2 },
    side:         { PARAM_ANGLE_Y: 0.3, PARAM_ANGLE_Z: -0.1 },
    winking:      { PARAM_EYE_L_OPEN: 1, PARAM_EYE_R_OPEN: 0, PARAM_EYE_SMILE: 0.5 },
    neutral:      {}
  }

  // 说话动作幅度/速度
  var GESTURE = {
    angry:        { amp: 1.4, speed: 1.25 },
    furious:      { amp: 1.4, speed: 1.25 },
    excited:      { amp: 1.25, speed: 1.15 },
    elated:       { amp: 1.25, speed: 1.15 },
    happy:        { amp: 1.1, speed: 1.05 },
    sad:          { amp: 0.6, speed: 0.7 },
    soft:         { amp: 0.7, speed: 0.8 },
    question:     { amp: 0.9, speed: 0.9 },
    blush:        { amp: 0.8, speed: 0.8 },
    annoyed:      { amp: 1.2, speed: 1.1 },
    thinking:     { amp: 0.7, speed: 0.6 },
    surprised:    { amp: 1.3, speed: 1.3 },
    disappointed: { amp: 0.55, speed: 0.65 },
    eyes_closed:  { amp: 0.4, speed: 0.5 },
    indifferent:  { amp: 0.5, speed: 0.7 },
    side:         { amp: 0.55, speed: 0.6 },
    winking:      { amp: 1.0, speed: 1.0 },
    neutral:      { amp: 1, speed: 1 }
  }

  return {
    EXPR: EXPR,
    EXPR_TO_EMO: EXPR_TO_EMO,
    FACE: FACE,
    C2_FACE: C2_FACE,
    GESTURE: GESTURE
  }
})()
