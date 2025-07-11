# BGVisuals - AI-Powered Music Visualizer

A split-screen, AI-powered music visualizer built with React, p5.js, and Tone.js. Perfect for creating YouTube video backgrounds for music mixes.

## 🎵 Features

### Current Implementation
- **Split-screen layout**: Left side shows p5.js canvas visuals, right side displays live code editor
- **Audio-reactive visuals**: 4 different scenes that respond to beat detection and audio features
- **Real-time code display**: Monaco editor shows the code driving the visuals with typing animations
- **Scene transitions**: Automatic scene changes every 30 seconds
- **Brand watermark**: Custom watermark overlay in bottom corner
- **Audio analysis**: Uses Tone.js + Meyda for real-time audio feature extraction

### Visual Scenes
1. **Neon Grid** - Cyberpunk grid with pulsing neon points
2. **Vaporwave Orbs** - Floating orbs with glow effects
3. **Pool Party Waves** - Flowing wave patterns
4. **Cyber Rave** - Scanlines and glitch effects

### Audio Features Detected
- RMS (energy level)
- Spectral centroid (brightness)
- Spectral rolloff
- Spectral flatness
- Zero crossing rate
- MFCC coefficients
- Beat detection
- BPM estimation

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd BGVisuals

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Usage
1. **Load Audio**: The app automatically loads "Ballads 4 Baddies [No Tags].wav" from `/public/audio/`
2. **Start Playback**: Click the "Play" button in the top-left corner
3. **Watch Visuals**: The left canvas will show audio-reactive visuals
4. **View Code**: The right panel shows the live code with typing animations
5. **Scene Changes**: Scenes automatically transition every 30 seconds

## 🏗️ Project Structure

```
BGVisuals/
├── public/
│   ├── audio/                    # Audio files
│   └── assets/                   # Images and watermarks
├── src/
│   ├── components/
│   │   ├── AudioController.tsx   # Audio playback and analysis
│   │   ├── BeatDetector.tsx      # Beat detection display
│   │   ├── CanvasVisualizer.tsx  # p5.js visual renderer
│   │   └── CodePanel.tsx         # Monaco code editor
│   ├── types/
│   │   └── audio.ts              # TypeScript interfaces
│   ├── App.tsx                   # Main application
│   └── index.css                 # Global styles
└── package.json
```

## 🎨 Customization

### Adding New Scenes
1. Add scene configuration to `CanvasVisualizer.tsx`
2. Create corresponding code template in `CodePanel.tsx`
3. Implement visual logic in the `draw` functions

### Audio File
Replace `/public/audio/Ballads 4 Baddies [No Tags].wav` with your own audio file and update the path in `AudioController.tsx`

### Visual Style
Modify colors, effects, and animations in `CanvasVisualizer.tsx` to match your brand aesthetic

## 🔮 Future Enhancements

### Planned Features
- **Whisper.cpp Integration**: Real-time lyric detection and display
- **Hugging Face API**: AI-generated visual prompts and lyrics
- **Video Export**: Record canvas and code pane to video file
- **More Visual Scenes**: Additional scene types and effects
- **Custom Audio Analysis**: Advanced beat detection and genre classification

### API Integration Hooks
The codebase includes placeholders for:
- Whisper.cpp for speech-to-text
- Hugging Face transformers for text generation
- MediaRecorder API for video export
- FFmpeg.wasm for video processing

## 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Audio**: Tone.js + Meyda
- **Visuals**: p5.js
- **Code Editor**: Monaco Editor
- **Beat Detection**: Custom implementation + Magenta.js

## 🎯 Brand Aesthetic

The visualizer follows a **neon, pool party, vaporwave** aesthetic with:
- Bright neon colors (#ff00ff, #00ffff, #ffff00)
- Glow effects and pulsing animations
- Cyberpunk and retro-futuristic elements
- Smooth transitions and audio reactivity

## 📝 Development Notes

### Current Issues
- Some TypeScript linter errors in audio analysis (non-blocking)
- Audio file path needs to be in `/public/audio/` for Vite to serve it
- Monaco editor requires proper type definitions

### Performance
- Canvas renders at 60fps
- Audio analysis runs at ~44kHz
- Scene transitions are smooth and non-blocking

## 🎬 YouTube Integration

This visualizer is designed to be:
- **70-minute compatible**: Handles long-form content
- **Brand-consistent**: Custom watermark and styling
- **Audio-synced**: Perfect timing with music
- **Export-ready**: Can be recorded for video upload

## 📄 License

[Your License Here]

---

Built with ❤️ for music visualization and creative coding

