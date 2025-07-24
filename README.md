# Ballads4Baddies Visualizer

A modern, audio-reactive music visualizer built with React, Three.js, and the Web Audio API. 
**Designed for both desktop and mobile, with a focus on performance, UX, and code quality.**

---

## 🚀 Features

- **Hybrid Audio Engine:**  
  - **Desktop:** Tone.js for playback and analysis  
  - **Mobile:** Native `<audio>` streaming + Web Audio API for real-time analysis
- **Audio-Reactive Visuals:**  
  - Real-time, music-driven 3D and 2D graphics
- **Responsive UI:**  
  - Optimized controls and layout for both desktop and mobile
- **Performance Optimized:**  
  - Efficient rendering, memory management, and mobile-specific code paths
- **No Secrets or Audio in Repo:**  
  - All sensitive data and media are managed outside version control

---

## 🏗️ Tech Stack

- **Frontend:** React 18 (TypeScript)
- **Audio:** Tone.js, Web Audio API
- **3D/Visuals:** Three.js, p5.js
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

---

## 🧩 Architecture

- **Hybrid AudioController:**  
  - Automatically switches between Tone.js (desktop) and `<audio>`+Web Audio API (mobile)
- **Modular Components:**  
  - Visualizer, audio controls, and UI are decoupled for easy extension
- **Environment-Driven:**  
  - All config and text via `.env` (never committed)

---

## 🛠️ Getting Started

```bash
git clone <your-repo-url>
cd BGVisuals
npm install
```

1. **Add your audio files:**  
   Place your MP3s in `/public/audio/` (not included in repo).
2. **Configure environment variables:**  
   Copy `.env.example` to `.env` and fill in any required values.
3. **Run locally:**  
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173)

---

## 🔒 Security & Best Practices

- **No audio files, secrets, or personal info are included in this repo.**
- **Do not commit:**  
  - Audio files (`/public/audio/`)
  - Any `.env` or `.env.*` files
  - API keys or secrets

---

## 📱 Mobile & Desktop

- **Desktop:**  
  - Tone.js for playback and analysis.
- **Mobile:**  
  - Native `<audio>` for streaming, with Web Audio API for analysis.
  - UI is touch-optimized.

---

## 📝 What I Learned / Why I Built This

This project demonstrates:
- Advanced use of the Web Audio API and hybrid playback strategies
- Building robust, cross-platform UIs with React and Tailwind
- Performance optimization for real-time graphics and audio
- Clean code organization and security best practices

I built this to push my skills in modern web audio/visualization, and to create a portfolio piece that’s both technically challenging and visually impressive.

---

## 🗣️ Lyric Transcription

> The lyric transcript JSON (`public/audio/ballads_4_baddies_transcript.json`) was generated using AssemblyAI’s speech-to-text API. The app loads this static transcript to display lyrics in sync with the music, but does not make any live API calls or use AI/ML at runtime.

---

## 🖼️ Screenshot

![Visualizer Screenshot](./preview-image.png)

---

## 🌐 Demo & Links

- **Web App:** [https://ballads4baddies.web.app/](https://ballads4baddies.web.app/)
- **YouTube (Screen Recording):** [https://youtu.be/51tTqc-WIAE](https://youtu.be/51tTqc-WIAE)
- **Audio on SoundCloud:** [https://soundcloud.com/irlhotperson/ballads-4-baddies](https://soundcloud.com/irlhotperson/ballads-4-baddies)

---

## 📄 License

MIT License

---

**Built for music, code, and creative technology.**

