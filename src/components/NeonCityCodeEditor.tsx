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
  const [code, setCode] = useState('');
  const [linesShown, setLinesShown] = useState(0);
  const [loading, setLoading] = useState(true);
  const codeLinesRef = useReactRef<string[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const animationFrameRef = useReactRef<number | null>();
  const [showCursor, setShowCursor] = useState(true);

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
        setCode(text);
        codeLinesRef.current = text.split('\n');
        setLinesShown(0);
        setLoading(false);
      });
  }, [fileIdx]);

  // Typing effect: reveal lines one by one, speed based on BPM/energy/beat, always loop files
  useEffect(() => {
    if (loading) return;
    const bpm = audioFeatures?.bpm || 120;
    const energy = audioFeatures?.energy || 0;
    const beat = audioFeatures?.beat ? 1 : 0;
    // Much faster, more jammy typing: on beat, go super fast
    let msPerLine = Math.max(8, Math.min(80, 6000 / (bpm + energy * 40)));
    if (beat) msPerLine = 8; // On beat, type instantly
    if (linesShown < codeLinesRef.current.length) {
      const timeout = setTimeout(() => {
        setLinesShown(l => l + 1);
      }, msPerLine);
      return () => clearTimeout(timeout);
    } else {
      // When finished, immediately start next file from the top
      const nextTimeout = setTimeout(() => {
        setFileIdx(idx => (idx + 1) % FILES.length);
        setLinesShown(0);
      }, 200);
      return () => clearTimeout(nextTimeout);
    }
  }, [linesShown, loading, audioFeatures, fileIdx]);

  // Blinking cursor effect
  useEffect(() => {
    // Cursor blinks faster and in sync with typing
    const bpm = audioFeatures?.bpm || 120;
    const beat = audioFeatures?.beat;
    let blinkMs = 200;
    if (beat) blinkMs = 60;
    else if (bpm > 160) blinkMs = 100;
    else if (bpm > 120) blinkMs = 140;
    const interval = setInterval(() => setShowCursor(c => !c), blinkMs);
    return () => clearInterval(interval);
  }, [audioFeatures]);

  // Always scroll to bottom as lines are revealed
  useEffect(() => {
    if (editorRef.current && linesShown > 0) {
      try {
        editorRef.current.revealLineInCenterIfOutsideViewport(linesShown);
      } catch (e) {}
    }
  }, [linesShown]);

  // When file changes, reset scroll and typing
  useEffect(() => {
    setScrollTop(0);
    setLinesShown(0);
  }, [fileIdx]);

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
        opacity: 0.25,
        border: 'none',
        boxShadow: 'none',
      }}
    >
      <MonacoEditor
        value={
          (() => {
            const lines = codeLinesRef.current.slice(0, linesShown);
            if (showCursor && linesShown < codeLinesRef.current.length) {
              // Add blinking cursor to the end of the last line
              if (lines.length === 0) return '▍';
              lines[lines.length - 1] = lines[lines.length - 1] + '▍';
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
          fontSize: 18,
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorStyle: 'line',
          cursorBlinking: 'solid',
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          renderWhitespace: 'none',
          renderValidationDecorations: 'off',
          wordWrap: 'on',
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
          },
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