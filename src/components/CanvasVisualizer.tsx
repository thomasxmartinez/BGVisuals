import React, { useRef, useEffect, useState } from 'react'
import p5 from 'p5'
import { AudioFeatures } from '../types/audio'
import ThreeCubeDance from './ThreeCubeDance'

interface CanvasVisualizerProps {
  audioFeatures: AudioFeatures
  isPlaying: boolean
  currentTime: number
  // isAudioReady?: boolean
  currentScene?: number
  sceneMap?: number[]
  audioStuck?: boolean
  onReady?: () => void
  currentLyrics?: string[]
  sceneTransition?: boolean
}

const CanvasVisualizerComponent: React.FC<CanvasVisualizerProps> = ({
  audioFeatures,
  isPlaying,
  currentTime,
  // isAudioReady = false,
  currentScene = 0,
  onReady,
  currentLyrics = []
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [, setIsLoading] = useState(true)
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
  
  // Debug scene changes
  useEffect(() => {
    console.log('🎭 Scene changed to:', currentScene, 'at timestamp:', Date.now());
  }, [currentScene]);

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
          
          // In the draw loop, only crossfade if sceneTransition is true, otherwise only show currentScene
          if (sceneTransition < 0.95) {
            // Render current scene with fade out
            const currentAlpha = 1 - sceneTransition
            sketch.push()
            sketch.tint(255, 255, 255, currentAlpha * 255)
            renderScene(sketch, currentSceneIndex, smoothedFeatures, isPlaying, 1)
            sketch.pop()
          } else {
            // Render new scene with fade in
            const newAlpha = (sceneTransition - 0.95) * 20 // 0.05 * 20 = 1
            sketch.push()
            sketch.tint(255, 255, 255, newAlpha * 255)
            renderScene(sketch, currentSceneIndex, smoothedFeatures, isPlaying, 1)
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
        const renderScene = (sketch: p5, sceneIndex: number, _audioFeatures: AudioFeatures, _isPlaying: boolean, _transition: number) => {
          
          // Debug logging - only log once per scene change
          if (!(sketch as any).lastLoggedScene || (sketch as any).lastLoggedScene !== sceneIndex) {
            console.log(`🎨 Rendering scene ${sceneIndex}, isPlaying: ${_isPlaying}, energy: ${_audioFeatures.energy}, canvas size: ${sketch.width}x${sketch.height}`)
            ;(sketch as any).lastLoggedScene = sceneIndex
          }
          
          // Only Cube Dance scene
          renderCubeDance(sketch, _audioFeatures, _isPlaying, _transition)
        }
        
        // Scene 0: Cube Dance - Three.js version
        const renderCubeDance = (sketch: p5, _audioFeatures: AudioFeatures, _isPlaying: boolean, _transition: number) => {
          // Clear the p5.js canvas and show a placeholder
          sketch.clear()
          // Show a message that Three.js is being used
          sketch.fill(255, 255, 255, 0.8)
          sketch.textAlign(sketch.CENTER, sketch.CENTER)
          sketch.textSize(24)
          sketch.text('Three.js Cube Dance Scene', sketch.width / 2, sketch.height / 2)
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
      {/* Three.js Cube Dance for scene 0 */}
      <div className="absolute inset-0 z-10 overflow-hidden">
        <ThreeCubeDance 
          key="threecubedance-stable"
          audioFeatures={audioFeatures}
          isPlaying={isPlaying}
          currentTime={currentTime}
        />
      </div>
      {/* Watermark removed; now handled globally in App.tsx */}
    </div>
  )
}

const CanvasVisualizer = React.memo(CanvasVisualizerComponent)

export default CanvasVisualizer