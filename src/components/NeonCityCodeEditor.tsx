import MonacoEditor, { loader } from '@monaco-editor/react';
import { useEffect, useState } from 'react';
import { useRef as useReactRef } from 'react';

// Neon City theme colors (from https://github.com/lakshits11/neon-city/blob/main/themes/Neon%20City-color-theme.json)
const neonCityTheme = {
  base: 'vs-dark' as any, // Cast as any to satisfy TS
  inherit: true,
  rules: [
    { token: '', foreground: 'e1e1e6', background: '18181b' },
    { token: 'comment', foreground: '7f8c8d', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'a259ff', fontStyle: 'bold' },
    { token: 'string', foreground: 'ff7edb' },
    { token: 'number', foreground: '36f9f6' },
    { token: 'type', foreground: '36f9f6' },
    { token: 'function', foreground: '36f9f6' },
    { token: 'variable', foreground: 'e1e1e6' },
    { token: 'identifier', foreground: 'e1e1e6' },
    { token: 'delimiter', foreground: 'a259ff' },
    { token: 'operator', foreground: 'a259ff' },
    { token: 'class', foreground: 'ff7edb' },
    { token: 'interface', foreground: '36f9f6' },
    { token: 'namespace', foreground: '36f9f6' },
    { token: 'parameter', foreground: '36f9f6' },
    { token: 'property', foreground: 'e1e1e6' },
    { token: 'enum', foreground: 'a259ff' },
    { token: 'enumMember', foreground: 'ff7edb' },
    { token: 'regexp', foreground: 'ff7edb' },
    { token: 'decorator', foreground: 'ff7edb' },
    { token: 'annotation', foreground: 'ff7edb' },
    { token: 'invalid', foreground: 'ff5555', fontStyle: 'underline' },
  ],
  colors: {
    'editor.background': '#18181b00', // transparent
    'editor.foreground': '#e1e1e6',
    'editor.lineHighlightBackground': '#2d1b6940',
    'editorCursor.foreground': '#a259ff',
    'editor.selectionBackground': '#a259ff40',
    'editor.inactiveSelectionBackground': '#a259ff20',
    'editorLineNumber.foreground': '#7f8c8d',
    'editorLineNumber.activeForeground': '#a259ff',
    'editorIndentGuide.background': '#2d1b69',
    'editorIndentGuide.activeBackground': '#a259ff',
    'editorWhitespace.foreground': '#2d1b69',
    'editorGutter.background': '#18181b00',
    'editorGutter.modifiedBackground': '#36f9f6',
    'editorGutter.addedBackground': '#36f9f6',
    'editorGutter.deletedBackground': '#ff5555',
    'editorWidget.background': '#18181b',
    'editorWidget.border': '#a259ff',
    'editorSuggestWidget.background': '#18181b',
    'editorSuggestWidget.border': '#a259ff',
    'editorSuggestWidget.foreground': '#e1e1e6',
    'editorSuggestWidget.selectedBackground': '#a259ff40',
    'editorSuggestWidget.highlightForeground': '#ff7edb',
    'editorHoverWidget.background': '#18181b',
    'editorHoverWidget.border': '#a259ff',
    'editorBracketMatch.background': '#a259ff40',
    'editorBracketMatch.border': '#a259ff',
    'editorOverviewRuler.border': '#a259ff',
    'editorOverviewRuler.errorForeground': '#ff5555',
    'editorOverviewRuler.warningForeground': '#ff7edb',
    'editorOverviewRuler.infoForeground': '#36f9f6',
    'editorError.foreground': '#ff5555',
    'editorWarning.foreground': '#ff7edb',
    'editorInfo.foreground': '#36f9f6',
  },
};

// List of files to cycle through (used in the app)
const FILES = [
  { path: '/code/AudioController.tsx', label: 'AudioController.tsx' },
  { path: '/code/BeatDetector.tsx', label: 'BeatDetector.tsx' },
  { path: '/code/CanvasVisualizer.tsx', label: 'CanvasVisualizer.tsx' },
  { path: '/code/CodePanel.tsx', label: 'CodePanel.tsx' },
  { path: '/code/LyricsDetector.tsx', label: 'LyricsDetector.tsx' },
  { path: '/code/ThreeCubeDance.tsx', label: 'ThreeCubeDance.tsx' },
];

interface NeonCityCodeEditorProps {
  audioFeatures?: { bpm?: number; energy?: number; beat?: boolean }
}

export default function NeonCityCodeEditor({ audioFeatures }: NeonCityCodeEditorProps) {
  // Music reactivity
  const editorRef = useReactRef<any>();
  const [fileIdx, setFileIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const codeLinesRef = useReactRef<string[]>([]);
  const [showCursor, setShowCursor] = useState(true);
  
  // Ultra-reactive scrolling state
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const animationFrameRef = useReactRef<number | null>(null);
  const lastTimeRef = useReactRef<number>(0);
  const allCodeRef = useReactRef<string>('');

  // Register theme on mount
  useEffect(() => {
    loader.init().then(monaco => {
      monaco.editor.defineTheme('neon-city', neonCityTheme);
    });
  }, []);

  // Fetch code for the current file
  useEffect(() => {
    setLoading(true);
    fetch(FILES[fileIdx].path)
      .then(res => res.text())
      .then(text => {
        // Filter out comments and empty lines for cleaner typing
        const lines = text.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 0 && 
                 !trimmed.startsWith('//') && 
                 !trimmed.startsWith('/*') && 
                 !trimmed.startsWith('*') &&
                 !trimmed.startsWith('*/');
        });
        codeLinesRef.current = lines;
        allCodeRef.current = lines.join('\n');
        setCurrentLineIndex(0);
        setLoading(false);
      });
  }, [fileIdx]);

  // Ultra-reactive animation loop using requestAnimationFrame
  useEffect(() => {
    if (loading) return;

    // Cancel any existing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Ultra-reactive speed calculation
      const bpm = audioFeatures?.bpm || 120;
      const energy = audioFeatures?.energy || 0;
      const beat = audioFeatures?.beat ? 1 : 0;
      
      // Sexy reactive speed - much more dramatic response
      let baseSpeed = 1000 / (bpm + energy * 200); // More energy = much faster
      if (beat) baseSpeed *= 0.1; // On beat = 10x faster!
      
      // Convert to line advancement
      const linesPerMs = baseSpeed / 1000;
      const linesToAdvance = linesPerMs * deltaTime;
      
      setCurrentLineIndex(prevIndex => {
        const newIndex = prevIndex + linesToAdvance;
        
        // If we've reached the end, move to next file immediately
        if (newIndex >= codeLinesRef.current.length) {
          setFileIdx(idx => (idx + 1) % FILES.length);
          return 0;
        }
        
        return newIndex;
      });

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [loading, audioFeatures, fileIdx]);

  // Update visible lines for smooth scrolling
  useEffect(() => {
    if (loading || !codeLinesRef.current.length) return;

    // Show a window of lines around the current position
    const windowSize = 25; // Smaller window for more focused view
    const startIndex = Math.max(0, Math.floor(currentLineIndex) - Math.floor(windowSize / 2));
    const endIndex = Math.min(codeLinesRef.current.length, startIndex + windowSize);
    
    const visible = codeLinesRef.current.slice(startIndex, endIndex);
    setVisibleLines(visible);
    
    // Smooth scroll to keep current line visible
    if (editorRef.current) {
      try {
        const lineInWindow = Math.floor(currentLineIndex) - startIndex;
        editorRef.current.revealLineInCenter(lineInWindow + 1);
      } catch (e) {
        // Silent fail
      }
    }
  }, [currentLineIndex, loading]);

  // Ultra-reactive cursor blinking
  useEffect(() => {
    const bpm = audioFeatures?.bpm || 120;
    const energy = audioFeatures?.energy || 0;
    const beat = audioFeatures?.beat;
    
    // Much more reactive cursor
    let blinkMs = 500;
    if (beat) blinkMs = 30; // Super fast on beat
    else if (energy > 0.7) blinkMs = 50; // Fast on high energy
    else if (bpm > 140) blinkMs = 100; // Fast on high BPM
    
    const interval = setInterval(() => setShowCursor(c => !c), blinkMs);
    return () => clearInterval(interval);
  }, [audioFeatures]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50vw',
        height: '100vh',
        zIndex: 1, // Behind CubeDance
        pointerEvents: 'none',
        background: 'transparent',
        opacity: 0.4,
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <style>
        {`
          .monaco-editor {
            border: none !important;
            outline: none !important;
          }
          .monaco-editor .overflow-guard {
            border: none !important;
            outline: none !important;
          }
          .monaco-editor .monaco-editor-background {
            border: none !important;
            outline: none !important;
          }
          .monaco-editor .margin {
            display: none !important;
          }
          .monaco-editor .decorationsOverviewRuler {
            display: none !important;
          }
          .monaco-editor .scrollbar {
            display: none !important;
          }
          .monaco-editor .monaco-scrollable-element {
            border: none !important;
            outline: none !important;
          }
        `}
      </style>
      <MonacoEditor
        value={
          (() => {
            if (loading || visibleLines.length === 0) return '▍';
            
            // Add cursor to the current line
            const lines = [...visibleLines];
            const currentLineInWindow = Math.floor(currentLineIndex) - Math.max(0, Math.floor(currentLineIndex) - Math.floor(25 / 2));
            
            if (showCursor && currentLineInWindow < lines.length && currentLineInWindow >= 0) {
              lines[currentLineInWindow] = lines[currentLineInWindow] + '▍';
            }
            
            return lines.join('\n');
          })()
        }
        language="typescript"
        theme="neon-city"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Hack Nerd Font', monospace",
          fontSize: 16,
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorStyle: 'line',
          cursorBlinking: 'solid',
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          renderWhitespace: 'none',
          renderValidationDecorations: 'off',
          wordWrap: 'off',
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
          },
          folding: false,
          glyphMargin: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          bracketPairColorization: {
            enabled: false,
          },
          colorDecorators: false,
          quickSuggestions: false,
          parameterHints: {
            enabled: false,
          },
          hover: {
            enabled: false,
          },
          contextmenu: false,

        }}
        height="100vh"
        width="50vw"
        onMount={(editor) => {
          editorRef.current = editor;
        }}
      />
    </div>
  );
} 