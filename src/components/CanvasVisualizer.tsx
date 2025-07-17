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
          
          // Array of all available render functions
          const renderFunctions = [
            renderCubeDance,
            renderScene2,
            renderScene3
          ]
          
          // Use sceneIndex directly (no more sceneMap)
          const actualSceneIndex = sceneIndex % renderFunctions.length
          const renderFunction = renderFunctions[actualSceneIndex]
          
          // Call the render function with appropriate parameters
          if (renderFunction) {
            // Always pass lyrics - functions that don't need it will ignore it
            renderFunction(sketch, audioFeatures, _isPlaying, _transition, lyrics)
          } else {
            // Fallback to first scene if function not found
            console.log('No render function found, using fallback')
            renderCubeDance(sketch, audioFeatures, _isPlaying, _transition, lyrics)
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
        
        // Scene 1: Shader Spheres (Three.js inspired by https://codepen.io/r21nomi/pen/LJmzbB)
        const renderScene2 = (sketch: p5, audioFeatures: AudioFeatures, _isPlaying: boolean, _transition: number, lyrics: string[]) => {
          const bass = audioFeatures.energy || 0
          const volume = audioFeatures.rms || 0
          const beat = audioFeatures.beat
          
          // Transparent background to show SVG watermark
          sketch.clear()
          
          // Create subtle gradient overlay
          for (let y = 0; y < sketch.height; y++) {
            const inter = sketch.map(y, 0, sketch.height, 0, 1)
            const c = sketch.lerpColor(sketch.color(0, 51, 77, 0.1), sketch.color(0, 0, 0, 0.05), inter)
            sketch.stroke(c)
            sketch.line(0, y, sketch.width, y)
          }
          
          // Audio-reactive parameters
          const time = sketch.frameCount * 0.02
          const audioTime = time * (1 + volume * 0.5)
          const sphereCount = 24 + Math.floor(bass * 20)
          const sphereSize = 15 + volume * 20 + (beat ? 10 : 0)
          
          // Synthwave colors
          const baseColor = sketch.color(0, 51, 77) // Dark cyan
          const accentColor = sketch.color(67, 250, 142) // Synthwave green
          const glowColor = sketch.color(255, 126, 219) // Pink
          
          // Draw animated spheres in circular patterns
          const centerX = sketch.width / 2
          const centerY = sketch.height / 2
          
          // Multiple rings of spheres
          const rings = [3, 2, 1.5] // Ring multipliers
          
          rings.forEach((ringMultiplier, ringIndex) => {
            const radius = 100 * ringMultiplier + bass * 50
            const ringSphereCount = sphereCount + ringIndex * 8
            
            for (let i = 0; i < ringSphereCount; i++) {
              const angle = (sketch.TWO_PI * i) / ringSphereCount + audioTime * 0.5
            const x = centerX + sketch.cos(angle) * radius
            const y = centerY + sketch.sin(angle) * radius
              
              // Audio-reactive sphere properties
              const size = sphereSize * (1 + sketch.sin(audioTime * 2 + i * 0.5) * 0.3)
              const rotation = audioTime * 4 + i * 0.2
              
              // Shader-like effect using p5.js
              sketch.push()
              sketch.translate(x, y)
              sketch.rotate(rotation)
              
              // Create shader-like glow effect
              const glowLayers = 8
              for (let layer = glowLayers; layer > 0; layer--) {
                const layerSize = size + layer * 8
                const alpha = (0.3 - layer * 0.03) * (0.5 + volume)
                
                // Color variation based on position and audio
                const hue = (180 + i * 15 + audioTime * 50) % 360
                const saturation = 80 + volume * 20
                const brightness = 60 + volume * 40
                
                sketch.fill(hue, saturation, brightness, alpha)
                sketch.noStroke()
                sketch.circle(0, 0, layerSize)
              }
              
              // Core sphere
              const coreHue = (200 + ringIndex * 30 + audioTime * 30) % 360
              sketch.fill(coreHue, 90, 90, 0.9)
              sketch.circle(0, 0, size)
              
              // Inner highlight
              sketch.fill(coreHue, 50, 100, 0.8)
              sketch.circle(0, 0, size * 0.6)
              
            sketch.pop()
          }
          })
          
          // Draw animated grid walls (shader-like effect)
          const gridSize = 40 + Math.floor(bass * 20)
          const cols = Math.floor(sketch.width / gridSize) + 2
          const rows = Math.floor(sketch.height / gridSize) + 2
          
          for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
              const x = j * gridSize
              const y = i * gridSize
              
              // Shader-like brightness calculation
              let brightness = 0
              const speed = audioTime * 1.5
              
              for (let k = 0; k < 8; k++) {
                const uvX = (x / sketch.width) * 8
                const uvY = (y / sketch.height) * 8
                brightness += 0.1 / sketch.abs(sketch.sin(sketch.PI * uvX) * sketch.sin(sketch.PI * uvY) * sketch.sin(sketch.PI * speed + k))
              }
              
              // Audio-reactive grid
              const gridHue = (200 + (i + j) * 5 + audioTime * 20) % 360
              const alpha = brightness * (0.1 + volume * 0.3) * (beat ? 2 : 1)
              
              sketch.fill(gridHue, 80, 80, alpha)
              sketch.noStroke()
              sketch.rect(x, y, gridSize, gridSize)
            }
          }
          
          // Add floating energy particles
          const particleCount = 30 + Math.floor(volume * 40)
          for (let i = 0; i < particleCount; i++) {
            const x = (Math.sin(i * 0.1 + audioTime * 0.5) * 0.5 + 0.5) * sketch.width
            const y = (Math.sin(i * 0.1 + 100 + audioTime * 0.5) * 0.5 + 0.5) * sketch.height
            const size = 2 + volume * 8 + (beat ? 4 : 0)
            const hue = (180 + i * 12 + audioTime * 40) % 360
            
            // Particle glow
            for (let j = 4; j > 0; j--) {
              const glowSize = size + j * 6
              const alpha = (0.4 - j * 0.08) * (0.3 + volume)
            sketch.fill(hue, 80, 80, alpha)
              sketch.noStroke()
              sketch.circle(x, y, glowSize)
            }
            
            // Core particle
            sketch.fill(hue, 90, 90, 0.9)
            sketch.circle(x, y, size)
          }
          
          // Display lyrics if available
          if (lyrics.length > 0) {
            sketch.push()
            sketch.textAlign(sketch.CENTER, sketch.CENTER)
            sketch.textSize(24 + volume * 8)
            sketch.fill(accentColor)
            sketch.stroke(0)
            sketch.strokeWeight(2)
            
            const currentLyric = lyrics[Math.floor(audioTime * 0.5) % lyrics.length]
            if (currentLyric) {
              sketch.text(currentLyric, sketch.width / 2, sketch.height * 0.9)
            }
            sketch.pop()
          }
        }

        // Scene 3: Physics-based hearts animation inspired by "Pile of Hearts"
        const renderScene3 = (sketch: p5, audioFeatures: AudioFeatures, _isPlaying: boolean, _transition: number, lyrics: string[]) => {
          // Initialize physics variables on first call
          if (!(sketch as any).heartsData) {
            (sketch as any).heartsData = {
              hearts: [],
              gravity: 0.3,
              bounce: 0.7,
              friction: 0.98,
              groundY: sketch.height * 0.8
            }
            
            // Create hearts
            for (let i = 0; i < 25; i++) {
              (sketch as any).heartsData.hearts.push({
                            x: -50 + Math.random() * (sketch.width + 100),
            y: -200 + Math.random() * 150,
            vx: -2 + Math.random() * 4,
            vy: -1 + Math.random() * 2,
            size: 15 + Math.random() * 20,
            rotation: Math.random() * sketch.TWO_PI,
            rotationSpeed: -0.1 + Math.random() * 0.2,
            color: sketch.color([280, 320, 340][Math.floor(Math.random() * 3)], 80, 90), // Pink/purple variations
            pulse: Math.random() * sketch.TWO_PI
              })
            }
          }
          
          // Audio-reactive background
          const energy = audioFeatures.energy || 0
          const bass = audioFeatures.spectralCentroid || 0
          
          // Transparent background to show SVG watermark
          sketch.clear()
          
          // Add subtle grid effect with transparency
          sketch.stroke(280, 30, 20, 0.2)
          sketch.strokeWeight(1)
          const gridSize = 50 + energy * 20
          for (let x = 0; x < sketch.width; x += gridSize) {
            sketch.line(x, 0, x, sketch.height)
          }
          for (let y = 0; y < sketch.height; y += gridSize) {
            sketch.line(0, y, sketch.width, y)
          }
          sketch.noStroke()
          
          // Update and draw hearts
          const hearts = (sketch as any).heartsData.hearts
          const gravity = (sketch as any).heartsData.gravity
          const bounce = (sketch as any).heartsData.bounce
          const friction = (sketch as any).heartsData.friction
          const groundY = (sketch as any).heartsData.groundY
          
          hearts.forEach((heart: any) => {
            // Apply physics
            heart.vy += gravity
            heart.x += heart.vx
            heart.y += heart.vy
            heart.rotation += heart.rotationSpeed
            heart.pulse += 0.1
            
            // Ground collision
            if (heart.y + heart.size > groundY) {
              heart.y = groundY - heart.size
              heart.vy *= -bounce
              heart.vx *= friction
            }
            
            // Wall collisions
            if (heart.x - heart.size < 0) {
              heart.x = heart.size
              heart.vx *= -0.8
            }
            if (heart.x + heart.size > sketch.width) {
              heart.x = sketch.width - heart.size
              heart.vx *= -0.8
            }
            
            // Audio reactivity
            const pulseScale = 1 + Math.sin(heart.pulse) * 0.1
            const audioScale = 1 + energy * 0.3
            const finalSize = heart.size * pulseScale * audioScale
            
            // Draw heart
            sketch.push()
            sketch.translate(heart.x, heart.y)
            sketch.rotate(heart.rotation)
            sketch.scale(finalSize / 25)
            
            // Heart shape with audio-reactive colors
            const heartHue = heart.color.levels[0] + energy * 10
            const heartSat = 80 + energy * 20
            const heartBright = 90 + energy * 10
            sketch.fill(heartHue, heartSat, heartBright)
            
            // Draw heart shape using bezier curves
            sketch.beginShape()
            sketch.vertex(0, -8)
            sketch.bezierVertex(-8, -8, -8, 4, 0, 8)
            sketch.bezierVertex(8, 4, 8, -8, 0, -8)
            sketch.endShape(sketch.CLOSE)
            
            // Add glow effect
            sketch.drawingContext.shadowColor = sketch.color(heartHue, heartSat, heartBright)
            sketch.drawingContext.shadowBlur = 10 + energy * 20
            
            sketch.pop()
          })
          
          // Add floating particles
          if (!(sketch as any).particlesData) {
            (sketch as any).particlesData = []
            for (let i = 0; i < 50; i++) {
              (sketch as any).particlesData.push({
                            x: Math.random() * sketch.width,
            y: Math.random() * sketch.height,
            vx: -0.5 + Math.random(),
            vy: -0.5 + Math.random(),
            size: 2 + Math.random() * 4,
            life: Math.random() * sketch.TWO_PI
              })
            }
          }
          
          // Update and draw particles
          const particles = (sketch as any).particlesData
          particles.forEach((particle: any) => {
            particle.x += particle.vx
            particle.y += particle.vy
            particle.life += 0.02
            
            if (particle.x < 0) particle.x = sketch.width
            if (particle.x > sketch.width) particle.x = 0
            if (particle.y < 0) particle.y = sketch.height
            if (particle.y > sketch.height) particle.y = 0
            
            const alpha = (Math.sin(particle.life) + 1) * 0.5
            sketch.fill(280, 60, 80, alpha * 0.6)
            sketch.circle(particle.x, particle.y, particle.size)
          })
          
          // Display lyrics if available
          if (lyrics && lyrics.length > 0) {
            sketch.fill(280, 80, 90)
            sketch.textAlign(sketch.CENTER, sketch.BOTTOM)
            sketch.textSize(24)
            sketch.text(lyrics[0], sketch.width / 2, sketch.height - 50)
          }
          
          // Add beat-reactive effects
          if (audioFeatures.beat) {
            // Flash effect on beat
            sketch.fill(280, 100, 100, 0.3)
            sketch.rect(0, 0, sketch.width, sketch.height)
          }
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
      {currentScene === 0 && (
        <div className="absolute inset-0 z-10">
          <ThreeCubeDance 
            audioFeatures={audioFeatures}
            isPlaying={isPlaying}
            currentTime={currentTime}
          />
        </div>
      )}
      
      {/* Canvas container for p5.js scenes (completely hidden when Three.js is active) */}
      {currentScene !== 0 && (
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
                'Shader Spheres',   // 1
                'Physics Hearts'    // 2
              ][currentScene]}`
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