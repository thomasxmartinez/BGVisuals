import { useState, useEffect, useRef } from 'react'
import React from 'react'
import CanvasVisualizer from './components/CanvasVisualizer'
import CodePanel from './components/CodePanel'
import AudioController from './components/AudioController'
import BeatDetector from './components/BeatDetector'
import LyricsDetector from './components/LyricsDetector'
import NeonCityReactiveBackground from './components/NeonCityReactiveBackground';
import NeonCityCodeEditor from './components/NeonCityCodeEditor';
import './index.css'
import { AudioFeatures } from './types/audio'

// Add this at the top of the file or in a global.d.ts file if you prefer
// @ts-ignore
// Vite raw loader declarations for TypeScript
// eslint-disable-next-line
declare module '*.ts?raw';

// Add ErrorBoundary component at the top
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-[99999] text-pink-400">
          <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-gray-900 p-4 rounded-lg max-w-xl overflow-x-auto text-left text-xs text-yellow-200 border border-pink-500/40">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 rounded bg-pink-600 text-white font-bold shadow-lg">Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [audioFeatures, setAudioFeatures] = useState<AudioFeatures>({
    rms: 0,
    spectralCentroid: 0,
    spectralRolloff: 0,
    spectralFlatness: 0,
    zcr: 0,
    mfcc: new Array(13).fill(0),
    beat: false,
    bpm: 120,
    energy: 0,
    valence: 0.5,
    arousal: 0.5
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentScene, setCurrentScene] = useState(0)
  const [sceneTransition, setSceneTransition] = useState(false)
  const sceneCount = 1 // Only Cube Dance
  const transitionDuration = 1 // seconds - faster transitions
  const lastSceneChangeRef = useRef(Date.now())
  const [isAudioReady, setIsAudioReady] = useState(false)
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [currentLyrics, setCurrentLyrics] = useState<string[]>([])
  
  // Remove sceneMap - we'll use all scenes sequentially

  // Update current time when playing
  useEffect(() => {
    if (isPlaying) {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
      }
      
      timeIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 0.1)
      }, 100)
      
      return () => {
        if (timeIntervalRef.current) {
          clearInterval(timeIntervalRef.current)
          timeIntervalRef.current = null
        }
      }
    } else {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
        timeIntervalRef.current = null
      }
    }
  }, [isPlaying])

  // Simple time-based scene transitions as primary mechanism
  useEffect(() => {
    if (!isPlaying) return
    
    const sceneInterval = setInterval(() => {
      // Only one scene, do nothing
    }, 30000) // Change scene every 30 seconds - much longer to see code typing
    
    return () => {
      clearInterval(sceneInterval)
    }
  }, [isPlaying, sceneCount])

  // Scene transitions based on BPM
  // useEffect(() => {
  //   const bpm = audioFeatures.bpm || 120
  //   setCurrentBpm(bpm)
  //   const minBpm = 125
  //   let scene = Math.floor(bpm - minBpm)
  //   if (scene < 0) scene = 0
  //   setCurrentScene(scene)
  // }, [audioFeatures.bpm])

  // Handle audio features update
  const handleFeaturesUpdate = (features: AudioFeatures) => {
    setAudioFeatures(features)
  }

  // Handle play state changes
  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing)
    if (!playing) {
      setCurrentTime(0)
      setCurrentScene(0)
    } else {
      // Reset scene timer when starting playback
      lastSceneChangeRef.current = Date.now()
    }
  }

  // Handle time updates
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(Math.max(0, time))
  }

  // Handle audio ready state
  const handleAudioReady = (ready: boolean) => {
    setIsAudioReady(ready)
  }

  // Handle lyrics updates
  const handleLyricsUpdate = (lyrics: string[]) => {
    setCurrentLyrics(lyrics)
  }

  // Manual scene cycling with keyboard
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only one scene, ignore scene switching keys
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [sceneCount])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
      }
    }
  }, [])

  // Lyrics-aware text: if lyrics, repeat them to fill the shape; else use 'irlhotperson'
  const textContent = (currentLyrics && currentLyrics.length > 0)
    ? Array(600).fill(currentLyrics.join(' • ')).join(' ')
    : Array(600).fill('irlhotperson').join(' ');

  return (
    <ErrorBoundary>
      {/* All previous app content goes here */}
      <div className="min-h-screen h-screen w-full relative overflow-hidden">
        {/* Neon City Code Editor as background */}
        <NeonCityCodeEditor audioFeatures={audioFeatures} />
        {/* Neon City music-reactive background for both panes */}
        {/* NeonCityReactiveBackground removed so Cube Dance is visible */}
        {/* Split left/right overlays, Cube Dance covers background */}
        <div className="absolute inset-0 w-full h-full z-0 flex flex-row">
          {/* Left: Lyrics SVG overlay */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="flex items-center justify-center w-full h-full pointer-events-none select-none">
              <img
                src="/assets/irlhotpersonhead.svg"
                alt="irlhotpersonhead"
                className="w-[95%] h-[95%] max-w-[800px] max-h-[95vh]"
                style={{
                  opacity: 0.25,
                  zIndex: 1
                }}
                draggable={false}
              />
              <p className={`absolute inset-0 flex items-center justify-center text-center dancing-svg-text-true-shape-p neon-gradient-text${audioFeatures.beat ? ' pulse' : ''}`}
                style={{
                  fontSize: '1.2vw',
                  opacity: 0.5,
                  lineHeight: 1.1,
                  fontWeight: 700,
                  width: '80%',
                  height: '80%',
                  left: '10%',
                  top: '10%',
                  zIndex: 2,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  WebkitMaskImage: 'url(/assets/irlhotpersonhead.svg)',
                  maskImage: 'url(/assets/irlhotpersonhead.svg)',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                  position: 'absolute',
                }}
              >{textContent}</p>
            </div>
          </div>
          {/* Right: Watermark SVG, same size as left SVG */}
          <div className="flex-1 flex items-center justify-center relative">
            <div className="flex items-center justify-center w-full h-full pointer-events-none select-none">
              <img
                src="/assets/watermark3.svg"
                alt="watermark"
                className="w-2/3 h-2/3 max-w-[350px] max-h-[40vh]"
                style={{
                  opacity: 0.13 + (audioFeatures.energy || 0) * 0.10 + (audioFeatures.beat ? 0.06 : 0),
                  filter: `drop-shadow(0 0 40px #2d1b69) drop-shadow(0 0 80px #a259ff) drop-shadow(0 0 120px #ff7edb)`,
                  transform: `scale(${1 + (audioFeatures.energy || 0) * 0.08 + (audioFeatures.beat ? 0.04 : 0)})`,
                  transition: 'transform 0.2s cubic-bezier(.4,2,.6,1), filter 0.2s cubic-bezier(.4,2,.6,1), opacity 0.2s cubic-bezier(.4,2,.6,1)',
                  zIndex: 1
                }}
                draggable={false}
              />
            </div>
          </div>
        </div>
        
        {/* Right pane removed; Cube Dance now covers the whole screen */}
        
        {/* Scene Transition Indicator */}
                {sceneTransition && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600/80 text-white px-4 py-2 rounded-lg font-mono text-sm animate-pulse">
              Scene Transition: 1/1
            </div>
          )}
        
        {/* Manual Scene Controls removed - no 1/1 indicator */}
        
        {/* Lyrics System */}
        <LyricsDetector
          isPlaying={isPlaying}
          currentTime={currentTime}
          audioFeatures={audioFeatures}
          onLyricsUpdate={handleLyricsUpdate}
        />
        
        {/* Audio not playing warning */}
        {!isPlaying && isAudioReady && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-black/80 text-yellow-400 text-3xl font-bold p-8 rounded-xl border-2 border-yellow-500 shadow-xl">
              AUDIO NOT PLAYING<br />
              Please click Play to start the visualizer
            </div>
          </div>
        )}
        
        {/* Tiny watermark in bottom right corner, fixed for the whole app */}
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none select-none">
          <img 
            src="/assets/watermark3.svg" 
            alt="watermark" 
            className="w-16 h-16"
            style={{
              opacity: 0.3,
              filter: 'drop-shadow(0 0 10px rgba(54, 249, 246, 0.3))'
            }}
          />
        </div>
        {/* Cube Dance visualizer at the very front */}
        <div className="absolute inset-0 w-full h-full z-50">
          <CanvasVisualizer
            audioFeatures={audioFeatures}
            isPlaying={isPlaying}
            currentTime={currentTime}
            isAudioReady={isAudioReady}
            currentScene={0}
            currentLyrics={currentLyrics}
          />
        </div>
        {/* Audio Controls overlay in top-left, now above the visualizer */}
        <div className="absolute top-2 left-2 z-50 w-64 max-w-[90vw] md:w-56 md:max-w-xs">
          <AudioController
            onFeaturesUpdate={handleFeaturesUpdate}
            onPlayStateChange={handlePlayStateChange}
            onTimeUpdate={handleTimeUpdate}
            onAudioReady={handleAudioReady}
            small
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App 