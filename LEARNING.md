# My AI Engineering Path
<!-- Managed by the ai-engineering-from-scratch learning skills.
     Repo: https://github.com/rohitg00/ai-engineering-from-scratch -->

## Mission
Become an AI engineer, built from the ground up. Foundations first, then the
depth: maths, ML, deep learning, transformers, LLMs from scratch, then the
applied stack (RAG, agents, tools and MCP, evals, inference, production).
Nothing skipped because it looks hard. Everything skipped that does not serve
the role.

## Placement
- Date: 2026-09-02
- Score: `self-selected` — building from foundations, full depth
- Entry point: Phase 00 — Setup & Tooling
- Pace: your own. Roughly 890 hours as scoped, ~20 months to graduation

## Path

The repo's own order, foundations first. It is sequenced this way on purpose
and that sequence is right for building the base. Only Generative AI is pushed
to the end.

| # | Phase | Name | Lessons | Status |
|---|-------|------|---------|--------|
| 1 | 00 | Setup & Tooling | 12 / 12 | Do |
| 2 | 01 | Math Foundations | 17 / 22 | Do |
| 3 | 02 | ML Fundamentals | 16 / 18 | Do |
| 4 | 03 | Deep Learning Core | 12 / 13 | Do |
| 5 | 04 | Computer Vision | 4 / 28 | Do |
| 6 | 05 | NLP — Foundations to Advanced | 15 / 29 | Do |
| 7 | 06 | Speech & Audio | 12 / 17 | Do |
| 8 | 07 | Transformers Deep Dive | 16 / 16 | Do |
| 9 | 09 | Reinforcement Learning | 12 / 12 | Do |
| 10 | 10 | LLMs from Scratch | 24 / 24 | Do |
| 11 | 11 | LLM Engineering | 17 / 17 | Do |
| 12 | 12 | Multimodal AI | 13 / 25 | Do |
| 13 | 13 | Tools & Protocols | 23 / 23 | Do |
| 14 | 14 | Agent Engineering | 42 / 42 | Do |
| 15 | 15 | Autonomous Systems | 11 / 22 | Do |
| 16 | 16 | Multi-Agent & Swarms | 25 / 25 | Do |
| 17 | 17 | Infrastructure & Production | 28 / 28 | Do |
| 18 | 18 | Ethics, Safety & Alignment | 30 / 30 | Do |
| 19 | 19 | Capstone Projects | 70 / 85 | Do |
| — | 08 | Generative AI | 15 / 15 | Do (deferred) |

**414 of 503 lessons.** Ten phases are kept whole. Nothing is skipped
wholesale any more.

Reinforcement Learning sits in its natural position rather than at the end.
You have already built two RL environments and trained with GRPO, so the
theory is a real gap and not future material. The `↓` control on its row
moves it back to the bottom in one click if you disagree.

## Excluded lessons

`/learn` skips everything here. A phase is finished once its **kept** lessons
are logged. The same set is mirrored in `site/hidden-seed.js`, so the website
matches this file.

**Phase 01 — Math (5 cut)**
`18-convex-optimization`, `19-complex-numbers`, `20-fourier-transform`,
`21-graph-theory`, `22-stochastic-processes`. Theory with no downstream use in
this path. Everything else stays, including the load-bearing ones: information
theory (cross-entropy, KL, perplexity), numerical stability, norms and
distances, sampling, SVD.

**Phase 02 — ML Fundamentals (2 cut)**
`15-time-series`, `16-anomaly-detection`. Different job family. Trees, SVMs,
ensembles, naive Bayes, feature engineering and pipelines all stay: they are
standard ML and they get asked in interviews.

**Phase 03 — Deep Learning Core (1 cut)**
`12-intro-to-jax`.

**Phase 04 — Computer Vision (24 cut, 4 kept)**
Kept only the deep-learning literacy spine: `02-convolutions-from-scratch`,
`03-cnns-lenet-to-resnet`, `05-transfer-learning`, `14-vision-transformers`.
Detection, segmentation, NeRF, diffusion, tracking, depth and the rest are a
different specialism.

**Phase 05 — NLP (14 cut, 15 kept)**
Cut the task-specific classical work: `05-sentiment-analysis`,
`06-named-entity-recognition`, `07-pos-tagging-parsing`,
`11-machine-translation`, `12-text-summarization`, `13-question-answering`,
`15-topic-modeling`, `16-text-generation-pre-transformer`,
`17-chatbots-rule-to-neural`, `18-multilingual-nlp`, `24-coreference-resolution`,
`25-entity-linking`, `26-relation-extraction-kg`, `29-dialogue-state-tracking`.
The ladder to transformers stays intact: word2vec, GloVe/fastText, CNNs and
RNNs for text, seq2seq, the attention lesson, subword tokenization. Do those
before Phase 07.

**Phase 06 — Speech & Audio (5 cut, 12 kept)**
Cut `03-audio-classification`, `06-speaker-recognition-verification`,
`08-voice-cloning-conversion`, `09-music-generation`,
`16-anti-spoofing-audio-watermarking`. The voice-product path stays whole:
audio fundamentals, spectrograms, ASR, Whisper, TTS, audio LMs, real-time
processing, the voice assistant pipeline, neural codecs, VAD and turn-taking,
streaming speech-to-speech, evaluation metrics.

**Phase 12 — Multimodal (12 cut, 13 kept)**
Cut the unified-generation architecture research: `04-flamingo`,
`08-llava-onevision`, `10-internvl3`, `11-chameleon`, `12-emu3`,
`13-transfusion`, `14-show-o`, `15-janus-pro`, `16-mio`,
`17-video-language-temporal-grounding`, `18-long-video-million-token`,
`21-embodied-vlas`. Kept ViT patch tokens, CLIP, BLIP-2 Q-Former, LLaVA
instruction tuning, any-resolution packing, open-weight VLM recipes, Qwen-VL,
audio-language models, omni thinker-talker, document understanding, ColPali,
multimodal RAG, multimodal agents.

**Phase 15 — Autonomous Systems (11 cut, 11 kept)**
Cut the research and policy reading: `02-star-family-reasoning`,
`03-alphaevolve`, `04-darwin-godel-machine`, `06-automated-alignment-research`,
`07-recursive-self-improvement`, `08-bounded-self-improvement`,
`17-constitutional-ai` (duplicate of 18/05), `19-anthropic-rsp`,
`20-openai-preparedness-deepmind-fsf`, `21-metr-external-evaluation`,
`22-cais-caisi-societal-risk`. Kept the operational half plus
`05-ai-scientist-v2`, which capstone 05 builds on.

**Phase 19 — Capstones (15 cut, 70 kept)**
Cut 3 flagships: `12-video-understanding-pipeline`,
`14-speculative-decoding-server`, `17-personal-ai-tutor`. Cut 2 build tracks:
`58-63` (VLM from scratch) and `76-81` (distributed training from scratch).
Everything else stays, including `03-realtime-voice-assistant` and the
`42-49` training-infra track.

## Capstone route

Prerequisites below come from each project's own doc, not guesswork. Run these
interleaved with the lessons, as each unlocks. `NN-NN` ranges are the guided
build tracks that scaffold the flagship next to them.

| After | Unlocks | Hrs | Build track first |
|---|---|---|---|
| Phases 11, 13, 17, 18 | **11** LLM Observability Dashboard | 25 | `70-75` eval harness |
| + Phase 14 | **13** MCP Server with Registry | 25 | — |
| + Phase 15 | **01** Terminal-Native Coding Agent | 35 | `20-29` agent harness |
| | **16** GitHub Issue-to-PR Agent | 30 | after capstone 01 |
| | **06** DevOps Troubleshooting Agent | 30 | — |
| + Phases 05, 07 | **02** RAG over Codebase | 30 | `64-69` RAG |
| | **09** Code Migration Agent | 30 | after capstone 01 |
| + Phase 12 | **08** Production RAG Chatbot | 30 | `64-69` RAG |
| | **04** Multimodal Document QA | 30 | — |
| + Phase 06 | **03** Real-Time Voice Assistant | 30 | — |
| + Phase 16 | **10** Multi-Agent Software Team | 40 | after capstone 01 |
| + Phase 10 | **15** Constitutional Safety Harness | 25 | `82-87` safety gate |
| + Phases 02, 03 | **07** End-to-End Fine-Tuning Pipeline | 35 | `30-41` LLM from scratch |
| | **05** Autonomous Research Agent | 40 | `50-57` research agent |

## Toolkit

Every lesson ships a reusable artifact under `outputs/`. `toolkit/collect.py`
gathers the ones from lessons you have logged into `toolkit/artifacts/` and
writes a browsable `toolkit/INDEX.md`.

```bash
python toolkit/collect.py              # collect from logged lessons
python toolkit/collect.py --available  # what is on offer, uncollected
```

Run it after each session. The deliverable at the end is a working toolkit.

## Progress log
| Date | Lesson | Quiz | Note |
|------|--------|------|------|

## Review queue
<!-- /learn adds lessons whose quiz score fell below 70% -->
