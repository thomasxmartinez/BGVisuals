import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { AudioFeatures } from '../types/audio'

interface CodePanelProps {
  audioFeatures: AudioFeatures
  currentScene: number
  isPlaying: boolean
  currentTime: number
  currentBpm: number
  code: string
}

const CodePanel: React.FC<CodePanelProps> = ({
  audioFeatures,
  currentScene,
  isPlaying,
  currentTime,
  currentBpm,
  code
}) => {
  const [currentCode, setCurrentCode] = useState('')
  const [currentLine, setCurrentLine] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingDots, setLoadingDots] = useState('')
  const [typingIndex, setTypingIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)
  const editorRef = useRef<any>(null)
  const lastSceneRef = useRef(currentScene)
  const lastCodeRef = useRef(code)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cursorBlinkRef = useRef<NodeJS.Timeout | null>(null)

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
  useEffect(() => { if (isPlaying) setIsLoading(false) }, [isPlaying])

  // Cursor blink effect
  useEffect(() => {
    if (isTyping) {
      cursorBlinkRef.current = setInterval(() => {
        setCursorVisible(prev => !prev)
      }, 500)
    } else {
      setCursorVisible(true)
    }
    
    return () => {
      if (cursorBlinkRef.current) {
        clearInterval(cursorBlinkRef.current)
      }
    }
  }, [isTyping])

  // Reset typing when scene/code changes
  useEffect(() => {
    if (lastSceneRef.current !== currentScene || lastCodeRef.current !== code) {
      lastSceneRef.current = currentScene
      lastCodeRef.current = code
      setCurrentCode('')
      setCurrentLine(1)
      setTypingIndex(0)
      setIsTyping(false)
      
      // Clear any existing typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [currentScene, code])

  // Realistic typing animation that matches repository execution
  useEffect(() => {
    if (!isPlaying || isLoading) return
    
    const startTyping = () => {
      setIsTyping(true)
      typeNextCharacter()
    }
    
    const typeNextCharacter = () => {
      if (typingIndex >= code.length) {
        setIsTyping(false)
        return
      }
      
      // Get next character
      const nextChar = code[typingIndex]
      setCurrentCode(prev => prev + nextChar)
      setTypingIndex(prev => prev + 1)
      
      // Realistic typing delays based on character type
      let delay = 80 // base delay for realistic typing
      
      if (nextChar === '\n') {
        delay = 300 // pause at line breaks like real typing
        setCurrentLine(prev => prev + 1)
      } else if (nextChar === ' ') {
        delay = 50 // quick spaces
      } else if (nextChar === '{' || nextChar === '}') {
        delay = 200 // pause for braces
      } else if (nextChar === '(' || nextChar === ')') {
        delay = 150 // pause for parentheses
      } else if (nextChar === ';') {
        delay = 180 // pause for semicolons
      } else if (nextChar === '.') {
        delay = 120 // pause for dots
      } else if (nextChar === ',') {
        delay = 100 // pause for commas
      }
      
      // Add realistic typing variation
      delay += Math.random() * 40 - 20 // ±20ms variation
      
      // Speed up during high energy moments - but keep it realistic
      if (audioFeatures.energy > 0.6) {
        delay *= 0.85 // moderate speedup
      }
      
      // Schedule next character
      typingTimeoutRef.current = setTimeout(typeNextCharacter, delay)
    }
    
    // Start typing after a realistic delay
    const startDelay = setTimeout(startTyping, 800)
    
    return () => {
      clearTimeout(startDelay)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [isPlaying, isLoading, typingIndex, code, audioFeatures.energy])

  // Editor mount
  const handleEditorDidMount = (editor: any) => { 
    editorRef.current = editor 
  }
  
  useEffect(() => {
    if (editorRef.current && currentCode) {
      try {
        // Add blinking cursor to the end of the code
        const codeWithCursor = isTyping ? currentCode + (cursorVisible ? '█' : '') : currentCode
        editorRef.current.setValue(codeWithCursor)
        
        // Scroll to the end smoothly
        const lineCount = codeWithCursor.split('\n').length
        editorRef.current.revealLineInCenter(lineCount)
      } catch {}
    }
  }, [currentCode, currentLine, isTyping, cursorVisible])

  // SynthWave '84 theme with neon glow effect (official colors from synthwave-color-theme.json)
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
      'editor.background': '#241b2f00', // transparent for watermark
      'editor.foreground': '#fede5d',
      'editor.lineHighlightBackground': '#2d213a',
      'editor.selectionBackground': '#ff7edb33',
      'editor.inactiveSelectionBackground': '#ff7edb22',
      'editorCursor.foreground': '#36f9f6',
      'editorWhitespace.foreground': '#3B3A32',
      'editorIndentGuide.activeBackground': '#ff7edb',
      'editor.selectionHighlightBorder': '#575757',
      'editor.lineNumber.foreground': '#fe8daa',
      'editor.lineNumber.activeForeground': '#ffe261',
      'editorGutter.background': '#241b2f00',
      'editorOverviewRuler.border': '#2d213a',
      'editorOverviewRuler.background': '#241b2f00',
      'scrollbarSlider.background': '#ff7edb33',
      'scrollbarSlider.hoverBackground': '#ff7edb55',
      'scrollbarSlider.activeBackground': '#ff7edb77'
    }
  }

  // Scene names for display
  const sceneNames = ['Neon Grid', 'Vaporwave Orbs', 'Pool Party Waves', 'Cyber Rave']

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* SynthWave '84 watermark background with glow effect */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none flex items-center justify-center">
        <img 
          src="/assets/watermark3.svg" 
          alt="watermark" 
          className="max-w-[70%] max-h-[70%] mx-auto my-auto opacity-20 filter drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]" 
          style={{ zIndex: 0 }}
        />
      </div>
      
      {/* Header with SynthWave styling */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-purple-500/50 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="text-cyan-400 font-mono text-sm font-bold filter drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
            🎧 Live Code Visualizer
          </div>
          <div className="text-purple-400 font-mono text-xs filter drop-shadow-[0_0_8px_rgba(147,51,234,0.4)]">
            Scene: {sceneNames[currentScene % 4]}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-green-400 font-mono text-xs filter drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
            BPM: {currentBpm}
          </div>
          <div className="text-yellow-400 font-mono text-xs filter drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
            {isPlaying ? '▶️ Playing' : '⏸️ Paused'}
          </div>
        </div>
      </div>
      
      {/* Code Editor with SynthWave theme */}
      <div className="flex-1 relative z-10">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="text-cyan-400 text-xl font-mono filter drop-shadow-[0_0_15px_rgba(0,255,255,0.6)]">
              Loading Code Editor{loadingDots}
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* Neon glow border effect */}
            <div className="absolute inset-0 border border-cyan-500/30 rounded-sm filter drop-shadow-[0_0_20px_rgba(0,255,255,0.3)] pointer-events-none" />
            
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="synthwave84"
              value={currentCode || '// Audio-reactive Visuals (p5.js)\n// Real-time code execution for live audio analysis\n\nfunction setup() {\n  createCanvas(windowWidth, windowHeight);\n  colorMode(HSB, 360, 100, 100, 1);\n  noStroke();\n}\n\nfunction draw() {\n  // Clear with gentle fade effect\n  fill(0, 0, 0, 0.05);\n  rect(0, 0, width, height);\n\n  // Get smoothed audio features from Tone.js analysis\n  const bass = smoothedAudioFeatures.energy || 0;\n  const treble = smoothedAudioFeatures.spectralCentroid || 0;\n  const volume = smoothedAudioFeatures.rms || 0;\n  const bpm = audioFeatures.bpm || 120;\n  const beat = shouldFlash; // Beat with cooldown\n\n  // Scene management - change every 90 seconds for stability\n  const sceneDuration = 90;\n  const shouldChangeScene = (currentTime - lastSceneChange > sceneDuration);\n  \n  if (shouldChangeScene && isPlaying) {\n    currentSceneIndex = (currentSceneIndex + 1) % 4;\n    lastSceneChange = currentTime;\n    sceneTransition = 0;\n  }\n  \n  // Smooth scene transition\n  if (sceneTransition < 1) {\n    sceneTransition += 0.01;\n  }\n  \n  // Render current scene based on audio analysis\n  switch (currentSceneIndex) {\n    case 0: renderNeonGrid(); break;\n    case 1: renderVaporwaveOrbs(); break;\n    case 2: renderPoolPartyWaves(); break;\n    case 3: renderCyberRave(); break;\n  }\n}'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: 'JetBrains Mono, monospace',
                fontLigatures: true,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible'
                },
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                overviewRulerLanes: 0,
                wordWrap: 'on',
                automaticLayout: true,
                renderWhitespace: 'none',
                renderControlCharacters: false,
                renderLineHighlight: 'all',
                cursorBlinking: 'solid',
                cursorSmoothCaretAnimation: 'on'
              }}
              onMount={handleEditorDidMount}
              beforeMount={(monaco) => {
                monaco.editor.defineTheme('synthwave84', synthwaveTheme)
              }}
            />
          </div>
        )}
      </div>
      
      {/* Footer with SynthWave styling */}
      <div className="relative z-10 p-3 border-t border-purple-500/50 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-4">
            <div className="text-cyan-400 filter drop-shadow-[0_0_8px_rgba(0,255,255,0.4)]">
              Energy: {(audioFeatures.energy * 100).toFixed(0)}%
            </div>
            <div className="text-purple-400 filter drop-shadow-[0_0_8px_rgba(147,51,234,0.4)]">
              RMS: {(audioFeatures.rms * 100).toFixed(0)}%
            </div>
            <div className="text-green-400 filter drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
              Spectral: {(audioFeatures.spectralCentroid * 100).toFixed(0)}%
            </div>
          </div>
          <div className="text-yellow-400 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]">
            Time: {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodePanel 