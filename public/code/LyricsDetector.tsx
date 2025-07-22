import React, { useEffect, useRef, useState } from 'react'

interface LyricsDetectorProps {
  isPlaying: boolean
  currentTime: number // in seconds
  audioFeatures: any
  onLyricsUpdate: (lyrics: string[]) => void
}

interface Word {
  text: string
  start: number // ms
  end: number // ms
  confidence: number
}

interface LyricLine {
  text: string
  startTime: number // seconds
  endTime: number // seconds
}

const LYRICS_JSON_PATH = '/audio/ballads_4_baddies_transcript.json'

const groupWordsIntoLines = (words: Word[], maxLineDuration = 4) => {
  // Group words into lines by max duration, punctuation, or natural breaks
  const lines: LyricLine[] = []
  let currentLine: string[] = []
  let lineStart: number | null = null
  
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (currentLine.length === 0) lineStart = w.start
    currentLine.push(w.text)
    
    // End line if:
    // 1. Punctuation (., !, ?)
    // 2. Max duration reached
    // 3. Natural pause (gap > 1 second between words)
    // 4. Last word
    const isPunct = /[.!?]/.test(w.text)
    const duration = lineStart !== null ? (w.end - lineStart) / 1000 : 0
    const nextWord = words[i + 1]
    const gap = nextWord ? (nextWord.start - w.end) / 1000 : 0
    const hasPause = gap > 1.0
    
    if (isPunct || duration >= maxLineDuration || hasPause || i === words.length - 1) {
      lines.push({
        text: currentLine.join(' '),
        startTime: lineStart !== null ? lineStart / 1000 : 0,
        endTime: w.end / 1000
      })
      currentLine = []
      lineStart = null
    }
  }
  return lines
}

const LyricsDetector: React.FC<LyricsDetectorProps> = ({
  isPlaying,
  currentTime,
  audioFeatures,
  onLyricsUpdate
}) => {
  const [lyricLines, setLyricLines] = useState<LyricLine[]>([])
  const [currentLyrics, setCurrentLyrics] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  // Load and parse transcript on mount
  useEffect(() => {
    fetch(LYRICS_JSON_PATH)
      .then(res => res.json())
      .then(data => {
        if (data.words) {
          const lines = groupWordsIntoLines(data.words)
          setLyricLines(lines)
        }
        setLoaded(true)
      })
      .catch(err => {
        setLoaded(true)
        setLyricLines([])
      })
  }, [])

  // Update current lyrics based on time
  useEffect(() => {
    if (!isPlaying || !loaded) {
      setCurrentLyrics([])
      onLyricsUpdate([])
      return
    }

    // Add a small offset to account for any timing differences
    const timeOffset = 0.5 // 0.5 second offset
    const adjustedTime = currentTime + timeOffset

    // Find lines that match current time (with some tolerance)
    const tolerance = 0.5 // 0.5 second tolerance
    const lines = lyricLines.filter(
      line => adjustedTime >= (line.startTime - tolerance) && adjustedTime <= (line.endTime + tolerance)
    )

    if (lines.length > 0) {
      setCurrentLyrics(lines.map(l => l.text))
      onLyricsUpdate(lines.map(l => l.text))
    } else {
      // Only show next line, not previous context (to avoid showing lyrics too early)
      const next = lyricLines.find(l => l.startTime > adjustedTime)
      if (next && (next.startTime - adjustedTime) < 2) { // Only show if within 2 seconds
        setCurrentLyrics([next.text])
        onLyricsUpdate([next.text])
      } else {
        setCurrentLyrics([])
        onLyricsUpdate([])
      }
    }
  }, [currentTime, isPlaying, loaded, lyricLines])

  return null // This component doesn't render anything visible
}

export default LyricsDetector 