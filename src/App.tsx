import { useState, useEffect, useRef } from 'react'
import CanvasVisualizer from './components/CanvasVisualizer'
import CodePanel from './components/CodePanel'
import AudioController from './components/AudioController'
import BeatDetector from './components/BeatDetector'
import LyricsDetector from './components/LyricsDetector'
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
  const [currentScene, setCurrentScene] = useState(0)
  const [sceneTransition, setSceneTransition] = useState(false)
  const sceneCount = 3 // Updated to use 3 new scenes
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
      setCurrentScene(prev => {
        const nextScene = (prev + 1) % sceneCount
        console.log(`Time-based scene transition: ${prev} -> ${nextScene}`)
        return nextScene
      })
      setSceneTransition(true)
      setTimeout(() => {
        setSceneTransition(false)
        lastSceneChangeRef.current = Date.now()
      }, transitionDuration * 1000)
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
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault()
        setSceneTransition(true)
        setTimeout(() => {
          setCurrentScene(prev => (prev + 1) % sceneCount)
          setSceneTransition(false)
          lastSceneChangeRef.current = Date.now()
        }, transitionDuration * 1000)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setSceneTransition(true)
        setTimeout(() => {
          setCurrentScene(prev => (prev - 1 + sceneCount) % sceneCount)
          setSceneTransition(false)
          lastSceneChangeRef.current = Date.now()
        }, transitionDuration * 1000)
      } else if (event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        const sceneNumber = parseInt(event.key)
        if (sceneNumber < sceneCount) {
          setSceneTransition(true)
          setTimeout(() => {
            setCurrentScene(sceneNumber)
            setSceneTransition(false)
            lastSceneChangeRef.current = Date.now()
          }, transitionDuration * 1000)
        }
      }
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

  return (
    <div className="min-h-screen h-screen w-full flex flex-col md:flex-row relative overflow-hidden">
      {/* Left: Visualizer with overlayed Audio Controls */}
      <div className="w-full md:w-1/2 h-full flex flex-col flex-1 min-h-0 p-0 md:p-0 bg-black/80 relative z-10 synthwave-bg">
        <div className="relative w-full h-full flex-1 min-h-0 p-0 m-0 flex">
          {/* Audio Controls overlay in top-left */}
          <div className="absolute top-2 left-2 z-30 w-64 max-w-[90vw] md:w-56 md:max-w-xs">
            <AudioController
              onFeaturesUpdate={handleFeaturesUpdate}
              onPlayStateChange={handlePlayStateChange}
              onTimeUpdate={handleTimeUpdate}
              onAudioReady={handleAudioReady}
              small
            />
          </div>
          {/* Visualizer fills entire pane */}
          <div className="flex-1 h-full w-full min-h-0 relative">
            <CanvasVisualizer
              audioFeatures={audioFeatures}
              isPlaying={isPlaying}
              currentTime={currentTime}
              isAudioReady={isAudioReady}
              currentScene={currentScene}
              sceneMap={[]} // No longer needed
              currentLyrics={currentLyrics}
            />
          </div>
        </div>
      </div>
      
      {/* Right: Code Panel */}
      <div className="w-full md:w-1/2 h-full flex flex-col items-center justify-start p-2 md:p-8 relative z-10">
        <div className="flex-1 w-full max-w-4xl mt-4">
          <CodePanel
            audioFeatures={audioFeatures}
            currentScene={currentScene}
            sceneTransition={sceneTransition}
            isPlaying={isPlaying}
            currentTime={currentTime}
            code={""}

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
      
      {/* Scene Transition Indicator */}
              {sceneTransition && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600/80 text-white px-4 py-2 rounded-lg font-mono text-sm animate-pulse">
            Scene Transition: {currentScene + 1}/{sceneCount}
          </div>
        )}
      
      {/* Manual Scene Controls */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        <button
          onClick={() => {
            setSceneTransition(true)
            setTimeout(() => {
              setCurrentScene(prev => (prev - 1 + sceneCount) % sceneCount)
              setSceneTransition(false)
            }, transitionDuration * 1000)
          }}
          className="bg-purple-600/80 text-white px-3 py-1 rounded font-mono text-sm hover:bg-purple-500/80"
        >
          ← Prev
        </button>
                  <div className="bg-purple-600/80 text-white px-3 py-1 rounded font-mono text-sm">
            {currentScene + 1}/{sceneCount}
          </div>
        <button
          onClick={() => {
            setSceneTransition(true)
            setTimeout(() => {
              setCurrentScene(prev => (prev + 1) % sceneCount)
              setSceneTransition(false)
            }, transitionDuration * 1000)
          }}
          className="bg-purple-600/80 text-white px-3 py-1 rounded font-mono text-sm hover:bg-purple-500/80"
        >
          Next →
        </button>
      </div>
      
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
    </div>
  )
}

export default App 