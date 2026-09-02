/**
 * Curated lesson set — AI engineer track, foundations included.
 *
 * Applied once per `version` by hidden-lessons.js on load, then never again:
 * delete or restore anything afterwards and the seed will not undo it.
 * Bump `version` to push a revised set.
 *
 * Kept: 414 of 503 lessons, including 70 of the 85 capstone entries.
 * Study order is the repo's own (foundations first). Only Generative AI is
 * pushed to the end.
 *
 * What was cut, and why:
 *   Phase 01  theory with no downstream use (convex opt, Fourier, graphs)
 *   Phase 02  time series + anomaly detection (different job family)
 *   Phase 03  JAX
 *   Phase 04  vision beyond the DL literacy spine (conv, CNN, transfer, ViT)
 *   Phase 05  task-specific classical NLP; the ladder to transformers stays
 *   Phase 06  music, voice cloning, speaker ID; the voice-product path stays
 *   Phase 12  unified-generation architecture research
 *   Phase 15  research + policy reading, no engineering
 *   Phase 19  video pipeline, spec-decoding server, tutor; VLM-from-scratch
 *             and distributed-training tracks
 */
window.AIFS_HIDDEN_SEED = {
  version: 'ai-engineer-scratch-to-deep-2026-09-02',

  // No phase is cut wholesale any more.
  phases: [],

  // Kept in full, pushed below the "Deferred to the end" divider.
  deferred: [
    '08-generative-ai',
  ],

  // Natural phase order: foundations first, exactly as the repo sequences it.
  order: [],

  lessons: [
    // 01-math-foundations
    'phases/01-math-foundations/18-convex-optimization',
    'phases/01-math-foundations/19-complex-numbers',
    'phases/01-math-foundations/20-fourier-transform',
    'phases/01-math-foundations/21-graph-theory',
    'phases/01-math-foundations/22-stochastic-processes',

    // 02-ml-fundamentals
    'phases/02-ml-fundamentals/15-time-series',
    'phases/02-ml-fundamentals/16-anomaly-detection',

    // 03-deep-learning-core
    'phases/03-deep-learning-core/12-intro-to-jax',

    // 04-computer-vision
    'phases/04-computer-vision/01-image-fundamentals',
    'phases/04-computer-vision/04-image-classification',
    'phases/04-computer-vision/06-object-detection-yolo',
    'phases/04-computer-vision/07-semantic-segmentation-unet',
    'phases/04-computer-vision/08-instance-segmentation-mask-rcnn',
    'phases/04-computer-vision/09-image-generation-gans',
    'phases/04-computer-vision/10-image-generation-diffusion',
    'phases/04-computer-vision/11-stable-diffusion',
    'phases/04-computer-vision/12-video-understanding',
    'phases/04-computer-vision/13-3d-vision-nerf',
    'phases/04-computer-vision/15-real-time-edge',
    'phases/04-computer-vision/16-vision-pipeline-capstone',
    'phases/04-computer-vision/17-self-supervised-vision',
    'phases/04-computer-vision/18-open-vocab-clip',
    'phases/04-computer-vision/19-ocr-document-understanding',
    'phases/04-computer-vision/20-image-retrieval-metric',
    'phases/04-computer-vision/21-keypoint-pose',
    'phases/04-computer-vision/22-3d-gaussian-splatting',
    'phases/04-computer-vision/23-diffusion-transformers-rectified-flow',
    'phases/04-computer-vision/24-sam3-open-vocab-segmentation',
    'phases/04-computer-vision/25-vision-language-models',
    'phases/04-computer-vision/26-monocular-depth',
    'phases/04-computer-vision/27-multi-object-tracking',
    'phases/04-computer-vision/28-world-models-video-diffusion',

    // 05-nlp-foundations-to-advanced
    'phases/05-nlp-foundations-to-advanced/05-sentiment-analysis',
    'phases/05-nlp-foundations-to-advanced/06-named-entity-recognition',
    'phases/05-nlp-foundations-to-advanced/07-pos-tagging-parsing',
    'phases/05-nlp-foundations-to-advanced/11-machine-translation',
    'phases/05-nlp-foundations-to-advanced/12-text-summarization',
    'phases/05-nlp-foundations-to-advanced/13-question-answering',
    'phases/05-nlp-foundations-to-advanced/15-topic-modeling',
    'phases/05-nlp-foundations-to-advanced/16-text-generation-pre-transformer',
    'phases/05-nlp-foundations-to-advanced/17-chatbots-rule-to-neural',
    'phases/05-nlp-foundations-to-advanced/18-multilingual-nlp',
    'phases/05-nlp-foundations-to-advanced/24-coreference-resolution',
    'phases/05-nlp-foundations-to-advanced/25-entity-linking',
    'phases/05-nlp-foundations-to-advanced/26-relation-extraction-kg',
    'phases/05-nlp-foundations-to-advanced/29-dialogue-state-tracking',

    // 06-speech-and-audio
    'phases/06-speech-and-audio/03-audio-classification',
    'phases/06-speech-and-audio/06-speaker-recognition-verification',
    'phases/06-speech-and-audio/08-voice-cloning-conversion',
    'phases/06-speech-and-audio/09-music-generation',
    'phases/06-speech-and-audio/16-anti-spoofing-audio-watermarking',

    // 12-multimodal-ai
    'phases/12-multimodal-ai/04-flamingo-gated-cross-attention',
    'phases/12-multimodal-ai/08-llava-onevision-single-multi-video',
    'phases/12-multimodal-ai/10-internvl3-native-multimodal',
    'phases/12-multimodal-ai/11-chameleon-early-fusion-tokens',
    'phases/12-multimodal-ai/12-emu3-next-token-for-generation',
    'phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion',
    'phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified',
    'phases/12-multimodal-ai/15-janus-pro-decoupled-encoders',
    'phases/12-multimodal-ai/16-mio-any-to-any-streaming',
    'phases/12-multimodal-ai/17-video-language-temporal-grounding',
    'phases/12-multimodal-ai/18-long-video-million-token',
    'phases/12-multimodal-ai/21-embodied-vlas-openvla-pi0-groot',

    // 15-autonomous-systems
    'phases/15-autonomous-systems/02-star-family-reasoning',
    'phases/15-autonomous-systems/03-alphaevolve-evolutionary-coding',
    'phases/15-autonomous-systems/04-darwin-godel-machine',
    'phases/15-autonomous-systems/06-automated-alignment-research',
    'phases/15-autonomous-systems/07-recursive-self-improvement',
    'phases/15-autonomous-systems/08-bounded-self-improvement',
    'phases/15-autonomous-systems/17-constitutional-ai',
    'phases/15-autonomous-systems/19-anthropic-rsp',
    'phases/15-autonomous-systems/20-openai-preparedness-deepmind-fsf',
    'phases/15-autonomous-systems/21-metr-external-evaluation',
    'phases/15-autonomous-systems/22-cais-caisi-societal-risk',

    // 19-capstone-projects
    'phases/19-capstone-projects/12-video-understanding-pipeline',
    'phases/19-capstone-projects/14-speculative-decoding-server',
    'phases/19-capstone-projects/17-personal-ai-tutor',
    'phases/19-capstone-projects/58-vision-encoder-patches',
    'phases/19-capstone-projects/59-vit-transformer',
    'phases/19-capstone-projects/60-projection-layer-modality-align',
    'phases/19-capstone-projects/61-cross-attention-fusion',
    'phases/19-capstone-projects/62-vision-language-pretraining',
    'phases/19-capstone-projects/63-multimodal-eval',
    'phases/19-capstone-projects/76-collective-ops-from-scratch',
    'phases/19-capstone-projects/77-data-parallel-ddp',
    'phases/19-capstone-projects/78-zero-parameter-sharding',
    'phases/19-capstone-projects/79-pipeline-parallel',
    'phases/19-capstone-projects/80-checkpoint-sharded-resume',
    'phases/19-capstone-projects/81-end-to-end-distributed-train',
  ]
};
