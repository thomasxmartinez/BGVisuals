# 🎧 irlhotperson Visualizer Video Generator – Spec for Cursor

## 🎯 Goal
Create a split-screen web-based video generator that:
1. Plays an original music track (~70 minutes, .wav)
2. Renders AI-powered, audio-reactive visuals with p5.js or Three.js
3. Displays the code generating those visuals in a live code editor
4. Uses AI tools (Magenta.js, Whisper.cpp, ONNX.js, etc.) to intelligently analyze the music
5. Is deployable as a GitHub portfolio project and usable to export YouTube-ready videos

---

## 📺 Output Layout
- **Split screen (50/50)**:
  - **Left**: Canvas rendering the visuals
  - **Right**: Live, syntax-highlighted code (Monaco Editor preferred)
    - Optional: fake typing or code reveal synced to track

---

## 💻 Technologies to Use

### 🟩 Core Web Tools
- `React` + `Tailwind CSS`
- `p5.js` or `Three.js` for visuals
- `Monaco Editor` or `Ace Editor` for code pane
- `HTML5 Audio` or `Tone.js` for playback

### 🧠 AI + Audio Analysis Tools

#### ✅ Magenta.js
- Beat and onset detection
- Rhythm-based triggers for visuals
- In-browser, no API needed  
➡ https://magenta.tensorflow.org/js

#### ✅ Tone.js + Meyda
- Real-time music feature extraction (RMS, spectral centroid, MFCCs, etc.)
- Deep control over playback and timeline sync
➡ https://tonejs.github.io  
➡ https://meyda.js.org

#### ✅ ONNX.js
- Load and run pre-trained AI models in-browser
- Use for genre, mood, or beat classification (if preprocessed models are available)
➡ https://github.com/microsoft/onnxjs

#### ✅ Whisper.cpp + WebAssembly
- Local lyrics-to-text transcription engine
- Sync visuals, code lines, or subtitles to lyrics in real-time
➡ https://github.com/ggerganov/whisper.cpp

#### ✅ Hugging Face + Colab (Optional Remote AI)
- For advanced lyrics sync, prompt-to-visual generation, or music structure analysis
- Example models:
  - `openai/whisper` (speech-to-text)
  - `facebook/musicgen` (for music-based prompt understanding)
  - `gpt2` or `stablelm` (for JS/GLSL generation)
➡ https://huggingface.co/models

---

## ✨ Features

### 1. Music-Aware Visuals
- Load and play full `.wav` track (provided)
- Visuals sync to:
  - BPM / beat drops (Magenta)
  - Frequency bands (Meyda)
  - Song sections (intros, builds, breakdowns)

### 2. Intelligent Scene Switching
- Use beat or mood detection to trigger:
  - Scene transitions
  - Color palette shifts
  - Shape transformations
  - Camera zooms or pans

### 3. Live Code Display
- Render the code generating the current visual
- Optional “highlight” or scroll to line being rendered
- Fake typing effect for storytelling feel

### 4. Lyrics Integration (Stretch)
- Transcribe lyrics with Whisper.cpp (local) or Whisper (HF)
- Animate code or visuals in sync with vocal phrases or keywords
- Optionally overlay subtitles

### 5. AI Prompt-to-Visual Mode (Stretch)
- Text prompt (e.g., “space rave with glowing orbs”) generates p5.js or GLSL code
- Update visuals and code pane live using a GPT-like model (WebLLM or Hugging Face)

---

## 🎨 Aesthetic
- Match the “irlhotperson” brand:
  - Sexy, flirty, fun
  - Neon nightclub × vaporwave × pool party
  - Clean UI with a modern or retro-future typeface
- Background music should **feel like a celebration** — not overproduced, but confident

---

## ✅ Deliverables
- Full GitHub-ready repo with:
  - `README.md` and setup instructions
  - MIT license
  - Components for audio, canvas, code editor, AI analysis
- Local working demo with sample track + generated visuals
- Easy deployment to GitHub Pages or Vercel
- Ability to swap in `.wav` file and `.psd` or `.png` branded asset

---

## 🧪 Stretch Goals
- Live code update + re-rendering as visuals change
- Multiple visual presets (e.g., disco mode, vaporwave mode)
- Export `.mp4` video from canvas (via `MediaRecorder` or `ffmpeg.wasm`)
- Prompt-based visual code generator
- Subtitles synced to lyrics

---

## 📎 References
- Visual Style: https://www.youtube.com/watch?v=K3-m4Gf6_bw
- Code Editor Style: https://carbon.now.sh
- Visual Toolkits: p5.js, shaders, procedural geometry
- AI Tools: Whisper.cpp, Hugging Face, Magenta.js

---

## 📂 You’ll Provide:
- Final `.wav` audio file (~70 minutes)
- Branded image (`.psd` or `.png`)
- Optional: custom font or palette references

---

