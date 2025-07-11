import React, { useRef, useEffect, useState } from 'react'
import p5 from 'p5'
import { AudioFeatures } from '../types/audio'

interface CanvasVisualizerProps {
  audioFeatures: AudioFeatures
  isPlaying: boolean
  currentTime: number
  isAudioReady?: boolean
  isAudioContextReady?: boolean
  currentBpm?: number
  currentScene?: number
  audioStuck?: boolean
  onReady?: () => void
}

const CanvasVisualizer: React.FC<CanvasVisualizerProps> = ({
  audioFeatures,
  isPlaying,
  currentTime,
  isAudioReady = false,
  isAudioContextReady = false,
  currentBpm = 120,
  currentScene = 0,
  audioStuck = false,
  onReady
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingDots, setLoadingDots] = useState('')
  const p5Instance = useRef<p5 | null>(null)
  const isInitialized = useRef(false)

  // Store latest audioFeatures and isPlaying in refs for p5 draw loop
  const latestAudioFeatures = useRef(audioFeatures)
  const latestIsPlaying = useRef(isPlaying)
  const latestCurrentTime = useRef(currentTime)
  useEffect(() => { latestAudioFeatures.current = audioFeatures }, [audioFeatures])
  useEffect(() => { latestIsPlaying.current = isPlaying }, [isPlaying])
  useEffect(() => { latestCurrentTime.current = currentTime }, [currentTime])

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
        let beatCooldown = 0
        
        sketch.setup = () => {
          try {
            const canvas = sketch.createCanvas(canvasRef.current!.offsetWidth, canvasRef.current!.offsetHeight)
            canvas.parent(canvasRef.current!)
            sketch.colorMode(sketch.HSB, 360, 100, 100, 1)
            sketch.noStroke()
            
            // Load watermark (optional)
            try {
              watermark = sketch.loadImage('/assets/watermark3.svg', () => {
                ready = true
                isInitialized.current = true
                setIsLoading(false)
                if (onReady) onReady()
              }, () => {
                // Continue without watermark
                ready = true
                isInitialized.current = true
                setIsLoading(false)
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
          
          // Get audio features with smoothing
          const audioFeatures = latestAudioFeatures.current
          const isPlaying = latestIsPlaying.current
          const currentTime = latestCurrentTime.current
          
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
          
          // Scene management - change every 90 seconds for stability
          const sceneDuration = 90 // longer duration
          const energyThreshold = 0.5 // higher threshold
          const shouldChangeScene = 
            (currentTime - lastSceneChange > sceneDuration) || 
            (smoothedBass > energyThreshold && currentTime - lastSceneChange > 45)
          
          if (shouldChangeScene && isPlaying) {
            currentSceneIndex = (currentSceneIndex + 1) % 4
            lastSceneChange = currentTime
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
          
          // Render with transition effect
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
        const renderScene = (sketch: p5, sceneIndex: number, audioFeatures: AudioFeatures, isPlaying: boolean, transition: number) => {
          const bass = audioFeatures.energy || 0
          const treble = audioFeatures.spectralCentroid || 0
          const volume = audioFeatures.rms || 0
          const bpm = audioFeatures.bpm || 120
          const beat = audioFeatures.beat
          
          switch (sceneIndex) {
            case 0:
              renderNeonGrid(sketch, audioFeatures, isPlaying, transition)
              break
            case 1:
              renderVaporwaveOrbs(sketch, audioFeatures, isPlaying, transition)
              break
            case 2:
              renderPoolPartyWaves(sketch, audioFeatures, isPlaying, transition)
              break
            case 3:
              renderCyberRave(sketch, audioFeatures, isPlaying, transition)
              break
          }
        }
        
        const renderNeonGrid = (sketch: p5, audioFeatures: AudioFeatures, isPlaying: boolean, transition: number) => {
          const bass = audioFeatures.energy || 0
          const volume = audioFeatures.rms || 0
          const beat = audioFeatures.beat
          
          // Stabilized neon grid pattern
          const gridSize = 60 + bass * 50 // reduced reactivity
          const neonIntensity = 0.2 + volume * 0.4 // reduced intensity
          
          for (let x = 0; x < sketch.width; x += gridSize) {
            for (let y = 0; y < sketch.height; y += gridSize) {
              const hue = (200 + x * 0.05 + y * 0.05) % 360 // slower color change
              const alpha = neonIntensity * (0.3 + sketch.noise(x * 0.005, y * 0.005) * 0.4) // gentler noise
              
              if (beat) {
                sketch.fill(hue, 80, 80, alpha * 1.2) // reduced beat flash
                sketch.rect(x - 1, y - 1, gridSize + 2, gridSize + 2) // smaller beat effect
              } else {
                sketch.fill(hue, 60, 60, alpha) // more subtle base
                sketch.rect(x, y, gridSize, gridSize)
              }
            }
          }
        }
        
        const renderVaporwaveOrbs = (sketch: p5, audioFeatures: AudioFeatures, isPlaying: boolean, transition: number) => {
          const bass = audioFeatures.energy || 0
          const treble = audioFeatures.spectralCentroid || 0
          const volume = audioFeatures.rms || 0
          const beat = audioFeatures.beat
          
          // Stabilized vaporwave orbs
          const orbCount = 3 + Math.floor(bass * 5) // fewer orbs
          
          for (let i = 0; i < orbCount; i++) {
            const x = sketch.width * (0.2 + i * 0.2)
            const y = sketch.height * 0.5 + sketch.sin(sketch.frameCount * 0.01 + i) * 60 // slower movement
            const size = 40 + bass * 60 + (beat ? 10 : 0) // reduced size changes
            const hue = (270 + i * 30 + sketch.frameCount * 0.2) % 360 // slower color rotation
            
            // Gentler orb glow effect
            for (let j = 3; j > 0; j--) {
              const glowSize = size + j * 15
              const alpha = (0.2 - j * 0.05) * (0.3 + volume) // reduced alpha
              sketch.fill(hue, 70, 70, alpha)
              sketch.circle(x, y, glowSize)
            }
            
            // Core orb
            sketch.fill(hue, 80, 80, 0.6) // more subtle
            sketch.circle(x, y, size)
          }
        }
        
        const renderPoolPartyWaves = (sketch: p5, audioFeatures: AudioFeatures, isPlaying: boolean, transition: number) => {
          const bass = audioFeatures.energy || 0
          const treble = audioFeatures.spectralCentroid || 0
          const volume = audioFeatures.rms || 0
          const beat = audioFeatures.beat
          
          // Stabilized pool party waves
          const waveCount = 2 // fewer waves
          const waveHeight = 30 + bass * 50 // reduced height
          
          for (let i = 0; i < waveCount; i++) {
            const hue = (50 + i * 20) % 360
            const y = sketch.height * 0.3 + i * 80
            
            sketch.beginShape()
            sketch.fill(hue, 80, 80, 0.3) // more subtle
            
            for (let x = 0; x < sketch.width; x += 15) { // larger step for smoother waves
              const waveY = y + sketch.sin(x * 0.005 + sketch.frameCount * 0.01 + i) * waveHeight
              sketch.vertex(x, waveY)
            }
            
            sketch.vertex(sketch.width, sketch.height)
            sketch.vertex(0, sketch.height)
            sketch.endShape(sketch.CLOSE)
          }
          
          // Fewer floating particles
          const particleCount = Math.floor(10 + volume * 20)
          for (let i = 0; i < particleCount; i++) {
            const x = sketch.noise(i * 0.1, sketch.frameCount * 0.005) * sketch.width
            const y = sketch.noise(i * 0.1 + 100, sketch.frameCount * 0.005) * sketch.height * 0.6
            const size = 2 + volume * 5 // smaller particles
            const hue = (50 + i * 10) % 360
            
            sketch.fill(hue, 80, 80, 0.6)
            sketch.circle(x, y, size)
          }
        }
        
        const renderCyberRave = (sketch: p5, audioFeatures: AudioFeatures, isPlaying: boolean, transition: number) => {
          const bass = audioFeatures.energy || 0
          const treble = audioFeatures.spectralCentroid || 0
          const volume = audioFeatures.rms || 0
          const beat = audioFeatures.beat
          
          // Stabilized cyber rave laser beams
          const beamCount = 6 // fewer beams
          const centerX = sketch.width / 2
          const centerY = sketch.height / 2
          
          for (let i = 0; i < beamCount; i++) {
            const angle = (i / beamCount) * sketch.PI * 2 + sketch.frameCount * 0.005 // slower rotation
            const endX = centerX + sketch.cos(angle) * sketch.width
            const endY = centerY + sketch.sin(angle) * sketch.height
            const hue = (210 + i * 45) % 360
            const intensity = 0.2 + volume * 0.4 // reduced intensity
            
            sketch.stroke(hue, 80, 80, intensity)
            sketch.strokeWeight(2 + bass * 5) // reduced weight
            sketch.line(centerX, centerY, endX, endY)
          }
          
          sketch.noStroke()
          
          // Gentler central energy core
          const coreSize = 40 + bass * 80 // reduced size
          const coreHue = (210 + sketch.frameCount * 1) % 360 // slower color change
          
          for (let i = 3; i > 0; i--) {
            const size = coreSize + i * 20
            const alpha = (0.3 - i * 0.08) * (0.3 + volume) // reduced alpha
            sketch.fill(coreHue, 80, 80, alpha)
            sketch.circle(centerX, centerY, size)
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
    <div className="relative w-full h-full bg-black">
      {/* Canvas container */}
      <div 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ 
          background: 'radial-gradient(circle at center, #1a0033 0%, #0a0010 100%)'
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-cyan-400 text-xl font-mono">
            Loading Visualizer{loadingDots}
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
        <div className="absolute bottom-4 left-4 bg-black/80 text-cyan-400 px-4 py-2 rounded font-mono text-sm">
          Scene: {['Neon Grid', 'Vaporwave Orbs', 'Pool Party Waves', 'Cyber Rave'][currentScene % 4]}
        </div>
      )}
    </div>
  )
}

export default CanvasVisualizer

// --- BEGIN: Visual Logic as String ---
export const visualLogicCode = `// Audio-reactive Visuals (p5.js)
// Real-time code execution for live audio analysis

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  noStroke();
}

function draw() {
  // Clear with gentle fade effect
  fill(0, 0, 0, 0.05);
  rect(0, 0, width, height);

  // Get smoothed audio features from Tone.js analysis
  const bass = smoothedAudioFeatures.energy || 0;
  const treble = smoothedAudioFeatures.spectralCentroid || 0;
  const volume = smoothedAudioFeatures.rms || 0;
  const bpm = audioFeatures.bpm || 120;
  const beat = shouldFlash; // Beat with cooldown

  // Scene management - change every 90 seconds for stability
  const sceneDuration = 90;
  const energyThreshold = 0.5;
  const shouldChangeScene = 
    (currentTime - lastSceneChange > sceneDuration) || 
    (bass > energyThreshold && currentTime - lastSceneChange > 45);
  
  if (shouldChangeScene && isPlaying) {
    currentSceneIndex = (currentSceneIndex + 1) % 4;
    lastSceneChange = currentTime;
    sceneTransition = 0;
  }
  
  // Smooth scene transition with proper timing
  if (sceneTransition < 1) {
    sceneTransition += 0.008; // slower transition for better effect
  }
  
  // Render current scene based on audio analysis
  switch (currentSceneIndex) {
    case 0: renderNeonGrid(); break;
    case 1: renderVaporwaveOrbs(); break;
    case 2: renderPoolPartyWaves(); break;
    case 3: renderCyberRave(); break;
  }
}

function renderNeonGrid() {
  // Stabilized neon grid pattern
  const gridSize = 60 + bass * 50;
  const neonIntensity = 0.2 + volume * 0.4;
  
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      const hue = (200 + x * 0.05 + y * 0.05) % 360;
      const alpha = neonIntensity * (0.3 + noise(x * 0.005, y * 0.005) * 0.4);
      
      if (beat) {
        fill(hue, 80, 80, alpha * 1.2);
        rect(x - 1, y - 1, gridSize + 2, gridSize + 2);
      } else {
        fill(hue, 60, 60, alpha);
        rect(x, y, gridSize, gridSize);
      }
    }
  }
}

function renderVaporwaveOrbs() {
  // Stabilized vaporwave orbs
  const orbCount = 3 + Math.floor(bass * 5);
  
  for (let i = 0; i < orbCount; i++) {
    const x = width * (0.2 + i * 0.2);
    const y = height * 0.5 + sin(frameCount * 0.01 + i) * 60;
    const size = 40 + bass * 60 + (beat ? 10 : 0);
    const hue = (270 + i * 30 + frameCount * 0.2) % 360;
    
    // Gentler orb glow effect
    for (let j = 3; j > 0; j--) {
      const glowSize = size + j * 15;
      const alpha = (0.2 - j * 0.05) * (0.3 + volume);
      fill(hue, 70, 70, alpha);
      circle(x, y, glowSize);
    }
    
    // Core orb
    fill(hue, 80, 80, 0.6);
    circle(x, y, size);
  }
}

function renderPoolPartyWaves() {
  // Stabilized pool party waves
  const waveCount = 2;
  const waveHeight = 30 + bass * 50;
  
  for (let i = 0; i < waveCount; i++) {
    const hue = (50 + i * 20) % 360;
    const y = height * 0.3 + i * 80;
    
    beginShape();
    fill(hue, 80, 80, 0.3);
    
    for (let x = 0; x < width; x += 15) {
      const waveY = y + sin(x * 0.005 + frameCount * 0.01 + i) * waveHeight;
      vertex(x, waveY);
    }
    
    vertex(width, height);
    vertex(0, height);
    endShape(CLOSE);
  }
  
  // Fewer floating particles
  const particleCount = Math.floor(10 + volume * 20);
  for (let i = 0; i < particleCount; i++) {
    const x = noise(i * 0.1, frameCount * 0.005) * width;
    const y = noise(i * 0.1 + 100, frameCount * 0.005) * height * 0.6;
    const size = 2 + volume * 5;
    const hue = (50 + i * 10) % 360;
    
    fill(hue, 80, 80, 0.6);
    circle(x, y, size);
  }
}

function renderCyberRave() {
  // Stabilized cyber rave laser beams
  const beamCount = 6;
  const centerX = width / 2;
  const centerY = height / 2;
  
  for (let i = 0; i < beamCount; i++) {
    const angle = (i / beamCount) * PI * 2 + frameCount * 0.005;
    const endX = centerX + cos(angle) * width;
    const endY = centerY + sin(angle) * height;
    const hue = (210 + i * 45) % 360;
    const intensity = 0.2 + volume * 0.4;
    
    stroke(hue, 80, 80, intensity);
    strokeWeight(2 + bass * 5);
    line(centerX, centerY, endX, endY);
  }
  
  noStroke();
  
  // Gentler central energy core
  const coreSize = 40 + bass * 80;
  const coreHue = (210 + frameCount * 1) % 360;
  
  for (let i = 3; i > 0; i--) {
    const size = coreSize + i * 20;
    const alpha = (0.3 - i * 0.08) * (0.3 + volume);
    fill(coreHue, 80, 80, alpha);
    circle(centerX, centerY, size);
  }
}

// Audio analysis variables (from Tone.js)
let audioFeatures = {
  rms: 0,
  energy: 0,
  spectralCentroid: 0,
  beat: false,
  bpm: 120
};

// Smoothed audio features for stable visuals
let smoothedAudioFeatures = {
  rms: 0,
  energy: 0,
  spectralCentroid: 0
};

let currentTime = 0;
let isPlaying = false;
let currentSceneIndex = 0;
let lastSceneChange = 0;
let sceneTransition = 0;
let shouldFlash = false;
`;
// --- END: Visual Logic as String --- 