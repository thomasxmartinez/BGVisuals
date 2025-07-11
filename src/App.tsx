import React, { useState, useEffect, useRef } from 'react'
import CanvasVisualizer, { visualLogicCode } from './components/CanvasVisualizer'
import CodePanel from './components/CodePanel'
import AudioController from './components/AudioController'
import BeatDetector from './components/BeatDetector'
import { AudioFeatures } from './types/audio'
import './index.css'

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
  const [duration, setDuration] = useState(0)
  const [currentScene, setCurrentScene] = useState(0)
  const [currentBpm, setCurrentBpm] = useState(120)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [isAudioContextReady, setIsAudioContextReady] = useState(false)
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Scene transitions based on BPM
  useEffect(() => {
    const bpm = audioFeatures.bpm || 120
    setCurrentBpm(bpm)
    const minBpm = 125
    let scene = Math.floor(bpm - minBpm)
    if (scene < 0) scene = 0
    setCurrentScene(scene)
  }, [audioFeatures.bpm])

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
    }
  }

  // Handle time updates
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(Math.max(0, time))
  }

  // Handle duration changes
  const handleDurationChange = (dur: number) => {
    setDuration(Math.max(0, dur))
  }

  // Handle audio ready state
  const handleAudioReady = (ready: boolean) => {
    setIsAudioReady(ready)
  }

  // Handle audio context ready state
  const handleAudioContextReady = (ready: boolean) => {
    setIsAudioContextReady(ready)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row synthwave-bg relative overflow-hidden">
      {/* Watermark as centered glowing background */}
      <img
        src="/assets/watermark3.svg"
        alt="watermark"
        className="main-watermark watermark-glow pointer-events-none select-none"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.18,
          zIndex: 0,
          width: '60vw',
          maxWidth: 700,
          minWidth: 300,
          filter: 'drop-shadow(0 0 60px #fff8) blur(1px)'
        }}
      />
      {/* Left: Visualizer with overlayed Audio Controls */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-screen flex flex-col p-0 md:p-0 bg-black/80 relative z-10">
        <div className="relative w-full h-full flex-1">
          {/* Audio Controls overlay in top-left */}
          <div className="absolute top-2 left-2 z-30 w-64 max-w-[90vw] md:w-56 md:max-w-xs">
            <AudioController
              onFeaturesUpdate={handleFeaturesUpdate}
              onPlayStateChange={handlePlayStateChange}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
              onAudioReady={handleAudioReady}
              onAudioContextReady={handleAudioContextReady}
              small
            />
          </div>
          {/* Visualizer fills entire pane */}
          <CanvasVisualizer
            audioFeatures={audioFeatures}
            isPlaying={isPlaying}
            currentTime={currentTime}
            isAudioReady={isAudioReady}
            isAudioContextReady={isAudioContextReady}
            currentBpm={currentBpm}
            currentScene={currentScene}
          />
        </div>
      </div>
      
      {/* Right: Code Panel */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-screen flex flex-col items-center justify-start p-2 md:p-8 bg-gradient-to-b from-[#2d1b69] to-[#1a1a1a] relative z-10">
        <div className="flex-1 w-full max-w-4xl mt-4">
          <CodePanel
            audioFeatures={audioFeatures}
            currentScene={currentScene}
            isPlaying={isPlaying}
            currentTime={currentTime}
            code={visualLogicCode}
            currentBpm={currentBpm}
          />
        </div>
      </div>
      
      {/* Beat Detector (for debugging) */}
      <div className="fixed top-4 right-4 z-50">
        <BeatDetector 
          audioFeatures={audioFeatures}
          isPlaying={isPlaying}
        />
      </div>
      
      {/* Audio not playing warning */}
      {!isPlaying && isAudioReady && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-black/80 text-yellow-400 text-3xl font-bold p-8 rounded-xl border-2 border-yellow-500 shadow-xl">
            AUDIO NOT PLAYING<br />
            Please click Play to start the visualizer
          </div>
        </div>
      )}
    </div>
  )
}

export default App 