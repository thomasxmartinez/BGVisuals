import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { AudioFeatures } from '../types/audio'

// SVG background pattern for the code editor - using CSS grid instead
const gridBackground = `
  linear-gradient(90deg, rgba(54, 249, 246, 0.1) 1px, transparent 1px),
  linear-gradient(rgba(54, 249, 246, 0.1) 1px, transparent 1px)
`

interface CodePanelProps {
  audioFeatures: AudioFeatures
  currentScene: number
  sceneTransition?: boolean
  isPlaying: boolean
  currentTime: number
  currentBpm?: number
  code?: string
}

// Scene-specific code snippets that correspond to the actual rendering functions
const sceneCodeSnippets = [
  // Scene 0: Cube Dance
  `// Cube Dance - Audio-reactive rotating cubes
// Inspired by Three.js CodePen with synthwave colors

function renderCubeDance() {
  const energy = audioFeatures.energy || 0;
  const volume = audioFeatures.rms || 0;
  const beat = audioFeatures.beat;
  
  // Audio-reactive background
  const bgHue = 280 + energy * 20;
  const bgSaturation = 20 + energy * 30;
  const bgBrightness = 5 + energy * 10;
  background(bgHue, bgSaturation, bgBrightness, 0.1);
  
  // Create multiple layers of rotating cubes
  const cubeCount = 8 + Math.floor(energy * 12);
  
  for (let i = 0; i < cubeCount; i++) {
    const time = frameCount * 0.01;
    const angle = (i / cubeCount) * TWO_PI + time;
    const radius = 80 + i * 40 + energy * 100;
    const x = width/2 + cos(angle) * radius;
    const y = height/2 + sin(angle) * radius;
    
    // Audio-reactive cube properties
    const size = 20 + volume * 30 + (beat ? 10 : 0);
    const rotation = time * 2 + i * 0.5;
    const hue = (280 + i * 30 + energy * 20) % 360;
    
    push();
    translate(x, y);
    rotate(rotation);
    
    // Multi-layer glow effect
    for (let j = 4; j > 0; j--) {
      const glowSize = size + j * 8;
      const alpha = (0.3 - j * 0.06) * (0.5 + volume);
      fill(hue, 80, 80, alpha);
      rect(-glowSize/2, -glowSize/2, glowSize, glowSize);
    }
    
    // Main cube
    fill(hue, 90, 90, 0.8);
    rect(-size/2, -size/2, size, size);
    
    // Inner highlight
    fill(hue, 50, 100, 0.6);
    rect(-size/4, -size/4, size/2, size/2);
    
    pop();
  }
  
  // Add floating particles
  const particleCount = 30 + Math.floor(volume * 40);
  for (let i = 0; i < particleCount; i++) {
    const x = noise(i * 0.1, time) * width;
    const y = noise(i * 0.1 + 100, time) * height;
    const size = 2 + volume * 6 + (beat ? 3 : 0);
    const hue = (280 + i * 15 + energy * 10) % 360;
    
    fill(hue, 80, 80, 0.7);
    circle(x, y, size);
  }
}`,

  // Scene 1: Shader Spheres
  `// Shader Spheres - Glowing spheres with grid effects
// Inspired by Three.js shader spheres with synthwave theme

function renderShaderSpheres() {
  const energy = audioFeatures.energy || 0;
  const volume = audioFeatures.rms || 0;
  const beat = audioFeatures.beat;
  
  // Audio-reactive background
  const bgHue = 200 + energy * 30;
  const bgSaturation = 30 + energy * 40;
  const bgBrightness = 8 + energy * 15;
  background(bgHue, bgSaturation, bgBrightness, 0.1);
  
  // Create multiple rings of glowing spheres
  const ringCount = 3;
  const spheresPerRing = 12 + Math.floor(energy * 8);
  
  for (let ring = 0; ring < ringCount; ring++) {
    const ringRadius = 100 + ring * 80 + energy * 60;
    const ringSpeed = 0.005 + ring * 0.002;
    const time = frameCount * ringSpeed;
    
    for (let i = 0; i < spheresPerRing; i++) {
      const angle = (i / spheresPerRing) * TWO_PI + time;
      const x = width/2 + cos(angle) * ringRadius;
      const y = height/2 + sin(angle) * ringRadius;
      
      // Audio-reactive sphere properties
      const size = 8 + volume * 15 + (beat ? 5 : 0);
      const hue = (200 + ring * 40 + i * 20 + energy * 15) % 360;
      const pulse = sin(frameCount * 0.05 + i * 0.5) * 0.2 + 1;
      
      // Multi-layer glow effect
      for (let j = 6; j > 0; j--) {
        const glowSize = size * pulse + j * 10;
        const alpha = (0.4 - j * 0.05) * (0.3 + volume);
        fill(hue, 80, 80, alpha);
        circle(x, y, glowSize);
      }
      
      // Core sphere
      fill(hue, 90, 90, 0.9);
      circle(x, y, size * pulse);
    }
  }
  
  // Add animated grid walls
  const gridSize = 60 + energy * 30;
  const gridAlpha = 0.2 + volume * 0.3;
  
  for (let x = 0; x < width; x += gridSize) {
    const waveOffset = sin(x * 0.01 + frameCount * 0.02) * 20;
    stroke(200, 60, 60, gridAlpha);
    strokeWeight(1);
    line(x, 0, x + waveOffset, height);
  }
  
  for (let y = 0; y < height; y += gridSize) {
    const waveOffset = cos(y * 0.01 + frameCount * 0.02) * 20;
    stroke(200, 60, 60, gridAlpha);
    strokeWeight(1);
    line(0, y, width, y + waveOffset);
  }
  
  // Add floating particles
  const particleCount = 40 + Math.floor(volume * 50);
  for (let i = 0; i < particleCount; i++) {
    const x = noise(i * 0.1, frameCount * 0.003) * width;
    const y = noise(i * 0.1 + 100, frameCount * 0.003) * height;
    const size = 3 + volume * 8 + (beat ? 4 : 0);
    const hue = (200 + i * 10 + energy * 20) % 360;
    
    fill(hue, 80, 80, 0.6);
    circle(x, y, size);
  }
}`,

  // Scene 2: Physics Hearts
  `// Physics Hearts - Bouncing hearts with physics simulation
// Inspired by "Pile of Hearts" CodePen with synthwave colors

function renderPhysicsHearts() {
  const energy = audioFeatures.energy || 0;
  const volume = audioFeatures.rms || 0;
  const beat = audioFeatures.beat;
  
  // Audio-reactive background
  const bgHue = 280 + energy * 20;
  const bgSaturation = 20 + energy * 30;
  const bgBrightness = 5 + energy * 10;
  background(bgHue, bgSaturation, bgBrightness, 0.1);
  
  // Physics variables
  const gravity = 0.3;
  const bounce = 0.7;
  const friction = 0.98;
  const groundY = height * 0.8;
  
  // Update and draw hearts
  hearts.forEach(heart => {
    // Apply physics
    heart.vy += gravity;
    heart.x += heart.vx;
    heart.y += heart.vy;
    heart.rotation += heart.rotationSpeed;
    heart.pulse += 0.1;
    
    // Ground collision
    if (heart.y + heart.size > groundY) {
      heart.y = groundY - heart.size;
      heart.vy *= -bounce;
      heart.vx *= friction;
    }
    
    // Wall collisions
    if (heart.x - heart.size < 0) {
      heart.x = heart.size;
      heart.vx *= -0.8;
    }
    if (heart.x + heart.size > width) {
      heart.x = width - heart.size;
      heart.vx *= -0.8;
    }
    
    // Audio reactivity
    const pulseScale = 1 + sin(heart.pulse) * 0.1;
    const audioScale = 1 + energy * 0.3;
    const finalSize = heart.size * pulseScale * audioScale;
    
    // Draw heart
    push();
    translate(heart.x, heart.y);
    rotate(heart.rotation);
    scale(finalSize / 25);
    
    // Heart shape with audio-reactive colors
    const heartHue = heart.color.levels[0] + energy * 10;
    const heartSat = 80 + energy * 20;
    const heartBright = 90 + energy * 10;
    fill(heartHue, heartSat, heartBright);
    
    // Draw heart shape using bezier curves
    beginShape();
    vertex(0, -8);
    bezierVertex(-8, -8, -8, 4, 0, 8);
    bezierVertex(8, 4, 8, -8, 0, -8);
    endShape(CLOSE);
    
    pop();
  });
  
  // Add floating particles
  particles.forEach(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life += 0.02;
    
    const alpha = (sin(particle.life) + 1) * 0.5;
    fill(280, 60, 80, alpha * 0.6);
    circle(particle.x, particle.y, particle.size);
  });
}`
]

const CodePanel: React.FC<CodePanelProps> = ({
  audioFeatures,
  currentScene,
  isPlaying,
  currentTime,
  currentBpm,
  code
}) => {
  const [displayedCode, setDisplayedCode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadingDots, setLoadingDots] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)
  const editorRef = useRef<any>(null)
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const cursorIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastSceneRef = useRef(currentScene)

  // Loading animation
  useEffect(() => {
    const dots = ['', '.', '..', '...']
    let dotIndex = 0
    const interval = setInterval(() => {
      setLoadingDots(dots[dotIndex])
      dotIndex = (dotIndex + 1) % dots.length
    }, 800)
    const timer = setTimeout(() => { setIsLoading(false) }, 2000)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [])
  
  useEffect(() => { 
    if (isPlaying) setIsLoading(false) 
  }, [isPlaying])

  // Cursor blink effect
  useEffect(() => {
    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible(prev => !prev)
    }, 500)
    
    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current)
      }
    }
  }, [])

  // Get the code for current scene
  const targetCode = sceneCodeSnippets[currentScene % 3] || code || ''

  // Start continuous typing on initial load
  useEffect(() => {
    if (!isLoading && targetCode) {
      startContinuousTyping(targetCode)
    }
  }, [isLoading, targetCode])

  // Reset and start typing when scene changes
  useEffect(() => {
    if (lastSceneRef.current !== currentScene) {
      lastSceneRef.current = currentScene
      setDisplayedCode('')
      
      // Clear any existing typing interval
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
        typingIntervalRef.current = null
      }
      
      // Start typing the new scene's code
      const newTargetCode = sceneCodeSnippets[currentScene % 3] || code || ''
      if (newTargetCode) {
        startContinuousTyping(newTargetCode)
      }
    }
  }, [currentScene, code])

  // Continuous typing function that loops
  const startContinuousTyping = (codeToType: string) => {
    if (!codeToType) return
    
    // Clear any existing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current)
    }
    
    let currentIndex = 0
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < codeToType.length) {
        setDisplayedCode(codeToType.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        // Finished typing, restart from beginning (continuous loop)
        currentIndex = 0
        setDisplayedCode('')
        // Small pause before restarting
        setTimeout(() => {
          if (typingIntervalRef.current) {
            setDisplayedCode(codeToType.slice(0, 1))
            currentIndex = 1
          }
        }, 500)
      }
    }, 15) // Faster typing to complete before scene change
  }

  // Editor mount
  const handleEditorDidMount = (editor: any) => { 
    editorRef.current = editor 
  }
  
  // Update editor content
  useEffect(() => {
    if (editorRef.current && displayedCode !== undefined) {
      try {
        const codeWithCursor = displayedCode + (cursorVisible ? '█' : '')
        editorRef.current.setValue(codeWithCursor)
        
        // Scroll to the end
        const lineCount = codeWithCursor.split('\n').length
        editorRef.current.revealLineInCenter(lineCount)
      } catch (error) {
        console.error('Editor update error:', error)
      }
    }
  }, [displayedCode, cursorVisible])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current)
      }
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current)
      }
    }
  }, [])

  // SynthWave '84 theme with neon glow effect
  const synthwaveTheme = {
    base: 'vs-dark' as const,
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'fe8daa', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff7edb' },
      { token: 'string', foreground: 'ffe261' },
      { token: 'number', foreground: 'fede5d' },
      { token: 'type', foreground: '36f9f6' },
      { token: 'class', foreground: '36f9f6' },
      { token: 'function', foreground: '36f9f6' },
      { token: 'variable', foreground: 'fede5d' },
      { token: 'constant', foreground: 'fede5d' },
      { token: 'operator', foreground: 'fede5d' },
      { token: 'delimiter', foreground: 'fede5d' },
      { token: 'predefined', foreground: '36f9f6' }
    ],
    colors: {
      'editor.background': '#00000000',
      'editor.foreground': '#fede5d',
      'editor.lineHighlightBackground': '#2d213a80',
      'editor.selectionBackground': '#ff7edb33',
      'editor.inactiveSelectionBackground': '#ff7edb22',
      'editorCursor.foreground': '#36f9f6',
      'editorWhitespace.foreground': '#3B3A32',
      'editorIndentGuide.activeBackground': '#ff7edb',
      'editor.selectionHighlightBorder': '#575757',
      'editor.lineNumber.foreground': '#fe8daa',
      'editor.lineNumber.activeForeground': '#ffe261',
      'editorGutter.background': '#00000000',
      'editorOverviewRuler.border': '#2d213a80',
      'editorOverviewRuler.background': '#00000000',
      'scrollbarSlider.background': '#ff7edb33',
      'scrollbarSlider.hoverBackground': '#ff7edb55',
      'scrollbarSlider.activeBackground': '#ff7edb77'
    }
  }

  // Scene names for display - updated to only show current 3 scenes
  const sceneNames = [
    'Cube Dance', 'Shader Spheres', 'Physics Hearts'
  ]

  return (
    <div 
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        background: 'transparent',
        position: 'relative'
      }}
    >
      {/* Grid Background Pattern */}
      
      {/* Neon glow overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(255, 0, 110, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(131, 56, 236, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      {/* SynthWave '84 watermark background with glow effect */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none flex items-center justify-center">
        <img 
          src="/assets/watermark3.svg" 
          alt="watermark" 
          className="w-96 h-96 watermark-transparent"
        />
      </div>

      {/* Header with scene info and controls */}
      <div className="relative z-10 flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-sm border-b border-purple-500/30">
        <div className="flex items-center gap-4">
          {/* Scene indicator */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-cyan-400 font-mono text-sm">
              Scene {currentScene}: {sceneNames[currentScene % 3]}
            </span>
          </div>
          
          {/* Audio info */}
          <div className="flex items-center gap-4 text-xs text-pink-300">
            <span>BPM: {currentBpm || '--'}</span>
            <span>Energy: {Math.round((audioFeatures.energy || 0) * 100)}%</span>
            <span>Volume: {Math.round((audioFeatures.rms || 0) * 100)}%</span>
          </div>
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center gap-3">
          {isPlaying && (
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-mono">PLAYING</span>
            </div>
          )}
          
          {isLoading && (
            <div className="text-yellow-400 text-xs font-mono">
              Loading{loadingDots}
            </div>
          )}
        </div>
      </div>

      {/* Code editor */}
      <div className="flex-1 relative z-10" style={{ background: 'transparent' }}>
        <Editor
          height="100%"
          defaultLanguage="javascript"
          theme="synthwave"
          value=""
          className="synthwave-code-editor"
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('synthwave', synthwaveTheme)
          }}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Consolas, monospace',
            lineNumbers: 'on',
            roundedSelection: false,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            overviewRulerLanes: 0,
            wordWrap: 'on',
            automaticLayout: true,
            folding: false,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            foldingHighlight: true,
            foldingImportsByDefault: true,
            unfoldOnClickAfterEnd: false,
            links: false,
            colorDecorators: true,
            codeActionsOnSave: {},
            codeActionsOnSaveTimeout: 750,
            tabCompletion: 'off' as any,
            wordBasedSuggestions: false as any,
            parameterHints: { enabled: false },
            suggestOnTriggerCharacters: false,
            acceptSuggestionOnCommitCharacter: false,
            acceptSuggestionOnEnter: 'off' as any,
            quickSuggestions: false as any,
            suggest: { showKeywords: false, showSnippets: false, showClasses: false, showFunctions: false, showVariables: false, showModules: false, showConstants: false, showEnums: false, showEnumMembers: false, showColors: false, showFiles: false, showReferences: false, showFolders: false, showTypeParameters: false, showWords: false, showUsers: false, showIssues: false, showOperators: false, showUnits: false, showValues: false },
            hover: { enabled: false },
            contextmenu: false,
            mouseWheelZoom: false,
            find: { addExtraSpaceOnTop: false, autoFindInSelection: 'never', seedSearchStringFromSelection: 'never' },
            multiCursorModifier: 'alt',
            accessibilitySupport: 'off',
            ariaLabel: 'Code Editor',
            renderControlCharacters: false as any,
            renderLineHighlight: 'all',
            renderValidationDecorations: 'on',
            renderIndentGuides: true,
            renderFinalNewline: false,
            glyphMargin: false,
            useTabStops: false,
            wordSeparators: '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?',
            lineHeight: 20,
            letterSpacing: 0.5,
            cursorBlinking: 'solid',
            cursorSmoothCaretAnimation: 'off',
            cursorStyle: 'line',
            cursorWidth: 2,
            smoothScrolling: false,
            mouseWheelScrollSensitivity: 1,
            fastScrollSensitivity: 5,
            scrollPredominantAxis: true,
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              verticalSliderSize: 6,
              horizontalSliderSize: 6,
              arrowSize: 11,
              useShadows: false
            }
          }}
          onMount={handleEditorDidMount}
        />

      </div>

      {/* Footer with additional info */}
      <div className="relative z-10 p-3 bg-gradient-to-r from-purple-900/60 to-pink-900/60 backdrop-blur-sm border-t border-purple-500/30">
        <div className="flex items-center justify-between text-xs text-pink-300">
          <div className="flex items-center gap-4">
            <span>Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
            <span>Frame: {Math.floor(currentTime * 60)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">SynthWave '84</span>
            <span>•</span>
            <span>p5.js Visualizer</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodePanel 