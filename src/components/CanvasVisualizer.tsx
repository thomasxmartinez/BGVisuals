import React, { useRef, useEffect, useState } from 'react'
import p5 from 'p5'
import { AudioFeatures } from '../types/audio'
import ThreeCubeDance from './ThreeCubeDance'

interface CanvasVisualizerProps {
  audioFeatures: AudioFeatures
  isPlaying: boolean
  currentTime: number
  isAudioReady?: boolean
  currentScene?: number
  sceneMap?: number[]
  audioStuck?: boolean
  onReady?: () => void
  currentLyrics?: string[]
}

const CanvasVisualizer: React.FC<CanvasVisualizerProps> = ({
  audioFeatures,
  isPlaying,
  currentTime,
  isAudioReady = false,
  currentScene = 0,
  sceneMap = [],
  audioStuck = false,
  onReady,
  currentLyrics = []
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const p5Instance = useRef<p5 | null>(null)
  const isInitialized = useRef(false)

  // Store latest audioFeatures and isPlaying in refs for p5 draw loop
  const latestAudioFeatures = useRef(audioFeatures)
  const latestIsPlaying = useRef(isPlaying)
  const latestCurrentTime = useRef(currentTime)
  const latestCurrentScene = useRef(currentScene)
  const latestCurrentLyrics = useRef(currentLyrics)
  useEffect(() => { latestAudioFeatures.current = audioFeatures }, [audioFeatures])
  useEffect(() => { latestIsPlaying.current = isPlaying }, [isPlaying])
  useEffect(() => { latestCurrentTime.current = currentTime }, [currentTime])
  useEffect(() => { latestCurrentScene.current = currentScene }, [currentScene])
  useEffect(() => { latestCurrentLyrics.current = currentLyrics }, [currentLyrics])
  
  // Debug logging for scene changes
  useEffect(() => {
    console.log(`🎭 Scene changed to: ${currentScene}`)
  }, [currentScene])

  useEffect(() => {
    if (!canvasRef.current || isInitialized.current) return
    if (p5Instance.current) return
    
    setIsLoading(true)
    
    try {
      p5Instance.current = new p5((sketch: p5) => {
        let ready = false
        let watermark: p5.Image | null = null
        let sceneTransition = 0 // 0-1 transition value
        let currentSceneIndex = 0
        let lastSceneChange = 0
        
        // Smoothing variables for stable visuals
        let smoothedBass = 0
        let smoothedTreble = 0
        let smoothedVolume = 0
        let lastBeatTime = 0
        
        sketch.setup = () => {
          try {
            console.log('🎯 CanvasVisualizer setup starting...')
            const canvasWidth = canvasRef.current!.offsetWidth
            const canvasHeight = canvasRef.current!.offsetHeight
            console.log(`📐 Canvas dimensions: ${canvasWidth}x${canvasHeight}`)
            const canvas = sketch.createCanvas(canvasWidth, canvasHeight)
            canvas.parent(canvasRef.current!)
            sketch.colorMode(sketch.HSB, 360, 100, 100, 1)
            sketch.noStroke()
            
            // Load watermark (optional)
            try {
              watermark = sketch.loadImage('/assets/watermark3.svg', () => {
                ready = true
                isInitialized.current = true
                setIsLoading(false)
                console.log('✅ CanvasVisualizer ready with watermark')
                if (onReady) onReady()
              }, () => {
                // Continue without watermark
                ready = true
                isInitialized.current = true
                setIsLoading(false)
                console.log('✅ CanvasVisualizer ready without watermark')
                if (onReady) onReady()
              })
            } catch (error) {
              // Continue without watermark
              ready = true
              isInitialized.current = true
              setIsLoading(false)
              if (onReady) onReady()
            }
            

          } catch (error) {
            console.error('Canvas setup error:', error)
            setIsLoading(false)
          }
        }
        
        sketch.draw = () => {
          if (!ready) return
          
          // Debug logging - only log every 60 frames (once per second at 60fps)
          if (!(sketch as any).frameCount) (sketch as any).frameCount = 0
          ;(sketch as any).frameCount++
          if ((sketch as any).frameCount % 60 === 0) {
            console.log(`🎬 Draw loop running - ready: ${ready}, isPlaying: ${latestIsPlaying.current}, currentScene: ${latestCurrentScene.current}`)
          }
          
          // Get audio features with smoothing
          const audioFeatures = latestAudioFeatures.current
          const isPlaying = latestIsPlaying.current
          const currentTime = latestCurrentTime.current
          const currentScene = latestCurrentScene.current
          
          // Smooth audio features to prevent seizure-inducing flickering
          const smoothingFactor = 0.1 // Lower = smoother, less reactive
          smoothedBass = smoothedBass * (1 - smoothingFactor) + (audioFeatures.energy || 0) * smoothingFactor
          smoothedTreble = smoothedTreble * (1 - smoothingFactor) + (audioFeatures.spectralCentroid || 0) * smoothingFactor
          smoothedVolume = smoothedVolume * (1 - smoothingFactor) + (audioFeatures.rms || 0) * smoothingFactor
          
          // Beat detection with cooldown to prevent rapid flashing
          const beat = audioFeatures.beat
          let shouldFlash = false
          if (beat && currentTime - lastBeatTime > 0.1) { // 100ms cooldown
            shouldFlash = true
            lastBeatTime = currentTime
          }
          
          // Use the scene from props instead of internal management
          const targetSceneIndex = currentScene
          
          // Only change scene if it's different from current
          if (targetSceneIndex !== currentSceneIndex) {
            currentSceneIndex = targetSceneIndex
            sceneTransition = 0
          }
          
          // Smooth scene transition with proper timing
          if (sceneTransition < 1) {
            sceneTransition += 0.008 // slower transition for better effect
          }
          
          // Clear with gentle fade effect
          sketch.fill(0, 0, 0, 0.05) // much gentler fade
          sketch.rect(0, 0, sketch.width, sketch.height)
          
          // Render current scene with smoothed values
          const smoothedFeatures = {
            ...audioFeatures,
            energy: smoothedBass,
            spectralCentroid: smoothedTreble,
            rms: smoothedVolume,
            beat: shouldFlash
          }
          
          // Get current lyrics from props
          const currentLyrics = latestCurrentLyrics.current
          
          // In the draw loop, only crossfade if sceneTransition is true, otherwise only show currentScene
          if (sceneTransition < 0.95) {
            // Render current scene with fade out
            const currentAlpha = 1 - sceneTransition
            sketch.push()
            sketch.tint(255, 255, 255, currentAlpha * 255)
            renderScene(sketch, currentSceneIndex, smoothedFeatures, isPlaying, 1, currentLyrics)
            sketch.pop()
          } else {
            // Render new scene with fade in
            const newAlpha = (sceneTransition - 0.95) * 20 // 0.05 * 20 = 1
            sketch.push()
            sketch.tint(255, 255, 255, newAlpha * 255)
            renderScene(sketch, currentSceneIndex, smoothedFeatures, isPlaying, 1, currentLyrics)
            sketch.pop()
          }
          
          // Watermark (if loaded) - fixed size and position
          if (watermark) {
            sketch.tint(255, 255, 255, 20) // more subtle
            const watermarkSize = Math.min(sketch.width, sketch.height) * 0.12
            const x = sketch.width - watermarkSize - 20
            const y = sketch.height - watermarkSize - 20
            sketch.image(watermark, x, y, watermarkSize, watermarkSize)
          }
        }
        
        // Scene rendering functions with stabilized parameters
        const renderScene = (sketch: p5, sceneIndex: number, audioFeatures: AudioFeatures, _isPlaying: boolean, _transition: number, lyrics: string[]) => {
          
          // Debug logging - only log once per scene change
          if (!(sketch as any).lastLoggedScene || (sketch as any).lastLoggedScene !== sceneIndex) {
            console.log(`🎨 Rendering scene ${sceneIndex}, isPlaying: ${_isPlaying}, energy: ${audioFeatures.energy}, canvas size: ${sketch.width}x${sketch.height}`)
            ;(sketch as any).lastLoggedScene = sceneIndex
          }
          
          // Two scenes: Cube Dance (0), Heart Packing (1)
          const actualSceneIndex = sceneIndex % 2
          
          if (actualSceneIndex === 0) {
            renderCubeDance(sketch, audioFeatures, _isPlaying, _transition, lyrics)
          } else {
            renderHeartPacking(sketch, audioFeatures, _isPlaying, _transition, lyrics)
          }
        }
        
        // Scene 0: Cube Dance - Three.js version
        const renderCubeDance = (sketch: p5, audioFeatures: AudioFeatures, _isPlaying: boolean, _transition: number, lyrics: string[]) => {
          const energy = audioFeatures.energy || 0
          const volume = audioFeatures.rms || 0
          const beat = audioFeatures.beat
          
          console.log('Three.js Cube Dance rendering, energy:', energy, 'volume:', volume)
          
          // Clear the p5.js canvas and show a placeholder
          sketch.clear()
          
          // Show a message that Three.js is being used
          sketch.fill(255, 255, 255, 0.8)
          sketch.textAlign(sketch.CENTER, sketch.CENTER)
          sketch.textSize(24)
          sketch.text('Three.js Cube Dance Scene', sketch.width / 2, sketch.height / 2)
          sketch.text(`Energy: ${energy.toFixed(2)}`, sketch.width / 2, sketch.height / 2 + 40)
          sketch.text(`Volume: ${volume.toFixed(2)}`, sketch.width / 2, sketch.height / 2 + 70)
          
          // Note: The actual Three.js rendering will be handled by the ThreeCubeDance component
          // This p5.js function is just a placeholder
        }
        
        // Scene 1: Heart Packing - Three.js version
        const renderHeartPacking = (sketch: p5, audioFeatures: AudioFeatures, _isPlaying: boolean, _transition: number, lyrics: string[]) => {
          const energy = audioFeatures.energy || 0
          const volume = audioFeatures.rms || 0
          const beat = audioFeatures.beat
          
          console.log('Three.js Heart Packing rendering, energy:', energy, 'volume:', volume)
          
          // Clear the p5.js canvas and show a placeholder
          sketch.clear()
          
          // Show a message that Three.js is being used
          sketch.fill(255, 255, 255, 0.8)
          sketch.textAlign(sketch.CENTER, sketch.CENTER)
          sketch.textSize(24)
          sketch.text('Three.js Heart Packing Scene', sketch.width / 2, sketch.height / 2)
          sketch.text(`Energy: ${energy.toFixed(2)}`, sketch.width / 2, sketch.height / 2 + 40)
          sketch.text(`Volume: ${volume.toFixed(2)}`, sketch.width / 2, sketch.height / 2 + 70)
          
          // Note: The actual Three.js rendering will be handled by the HeartPacking component
          // This p5.js function is just a placeholder
        }
        

        




        // Handle window resize
        sketch.windowResized = () => {
          if (canvasRef.current) {
            sketch.resizeCanvas(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight)
          }
        }
      })
    } catch (error) {
      console.error('P5 initialization error:', error)
      setIsLoading(false)
    }
    
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }
    }
  }, [onReady])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
        p5Instance.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full bg-transparent p-0 m-0 flex-1" style={{ minHeight: 0, minWidth: 0 }}>
      {/* Only Cube Dance scene remains */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <ThreeCubeDance 
          audioFeatures={audioFeatures}
          isPlaying={isPlaying}
          currentTime={currentTime}
        />
      </div>
      

      
      {/* Canvas container for p5.js scenes (completely hidden when Three.js is active) */}
      {currentScene !== 0 && currentScene !== 1 && (
        <div 
          ref={canvasRef} 
          className="w-full h-full p-0 m-0 flex-1"
          style={{ 
            background: 'transparent',
            minHeight: 0,
            minWidth: 0
          }}
        />
      )}
      
      {/* Loading overlay */}
      {isLoading && currentScene !== 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-cyan-400 text-xl font-mono">
            Loading Visualizer...
          </div>
        </div>
      )}
      
      {/* Audio status overlay */}
      {!isPlaying && isAudioReady && (
        <div className="absolute top-4 left-4 bg-black/80 text-yellow-400 px-4 py-2 rounded font-mono text-sm">
          ⏸️ Audio paused
        </div>
      )}
      
      {/* Audio stuck warning */}
      {audioStuck && (
        <div className="absolute top-4 right-4 bg-red-900/80 text-red-400 px-4 py-2 rounded font-mono text-sm">
          ⚠️ Audio data stuck
        </div>
      )}
      
      {/* Scene transition indicator */}
      {isPlaying && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-cyan-400 px-4 py-2 rounded font-mono text-sm flex items-center gap-2">
          {/* irlhotpersonhead SVG guide */}
          <img
            src="/assets/irlhotpersonhead.svg"
            alt="lyrics guide"
            className="w-4 h-4 opacity-80"
            style={{
              filter: 'drop-shadow(0 0 8px #36f9f6)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
          {/* Lyrics display */}
          <span>
            {currentLyrics && currentLyrics.length > 0 
              ? currentLyrics.join(' • ')
              : `Scene: ${[
                'Cube Dance',       // 0
                'Heart Packing'     // 1
              ][currentScene % 2]}`
            }
          </span>
        </div>
      )}

      {/* Small watermark in bottom right corner */}
      <div className="absolute bottom-4 right-4 z-20 pointer-events-none select-none">
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
    </div>
  )
}

export default CanvasVisualizer