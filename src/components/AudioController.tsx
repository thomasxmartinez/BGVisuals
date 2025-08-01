import React, { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { AudioFeatures } from '../types/audio'

interface AudioControllerProps {
  onFeaturesUpdate: (features: AudioFeatures) => void
  onPlayStateChange: (isPlaying: boolean) => void
  onTimeUpdate: (time: number) => void
  onDurationChange?: (duration: number) => void
  onAudioReady?: (ready: boolean) => void
  onAudioContextReady?: (ready: boolean) => void
  small?: boolean
}

const AudioController: React.FC<AudioControllerProps> = ({
  onFeaturesUpdate,
  onPlayStateChange,
  onTimeUpdate,
  onDurationChange,
  onAudioReady,
  onAudioContextReady,
  small = false
}) => {
  const [audioFiles, setAudioFiles] = useState<Array<{ name: string, path: string, size?: string, type?: string }>>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [initError, setInitError] = useState<string | null>(null)
  
  const playerRef = useRef<Tone.Player | null>(null)
  const analyzerRef = useRef<Tone.Analyser | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)
  const isDisposed = useRef(false)

  // On mount, fetch audio files from /audio/ directory
  useEffect(() => {
    // Only include the two allowed files for deployment
    setAudioFiles([
      {
        name: 'Ballads_4_Baddies_Final.mp3',
        path: '/audio/Ballads_4_Baddies_Final.mp3',
        type: 'MP3',
      },
      {
        name: 'Ballads_4_Baddies_No_Tags.mp3',
        path: '/audio/Ballads_4_Baddies_No_Tags.mp3',
        type: 'MP3',
      },
    ])
  }, [])

  // Cleanup function
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (playerRef.current) {
      playerRef.current.dispose()
      playerRef.current = null
    }
    if (analyzerRef.current) {
      analyzerRef.current.dispose()
      analyzerRef.current = null
    }
    isDisposed.current = true
  }

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [])

  // Utility to detect mobile browsers
  const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)

  // Mobile-specific refs and state
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const analyserNodeRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const animationFrameMobileRef = useRef<number | null>(null)
  const [isMobilePlaying, setIsMobilePlaying] = useState(false)
  const [mobileDuration, setMobileDuration] = useState(0)
  const [mobileCurrentTime, setMobileCurrentTime] = useState(0)

  // Mobile: Setup analyser when audio element is ready
  useEffect(() => {
    if (!isMobile || !audioElementRef.current) return
    if (analyserNodeRef.current) return // Already set up
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = ctx
      const source = ctx.createMediaElementSource(audioElementRef.current)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      analyser.connect(ctx.destination)
      analyserNodeRef.current = analyser
      // Feature extraction loop
      const updateFeatures = () => {
        if (!analyserNodeRef.current) return
        const bufferLength = analyserNodeRef.current.fftSize
        const dataArray = new Float32Array(bufferLength)
        analyserNodeRef.current.getFloatTimeDomainData(dataArray)
        // Calculate RMS
        const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length)
        // Create features (match desktop shape)
        const audioFeatures: AudioFeatures = {
          rms: rms,
          spectralCentroid: 1000 + rms * 1000,
          spectralRolloff: 2000 + rms * 2000,
          spectralFlatness: 0.5 - rms * 0.3,
          zcr: rms * 10,
          mfcc: new Array(13).fill(rms),
          beat: rms > 0.1,
          bpm: 120 + rms * 60,
          energy: Math.min(1, rms * 5),
          valence: 0.5 + rms * 0.3,
          arousal: rms * 2
        }
        onFeaturesUpdate(audioFeatures)
        animationFrameMobileRef.current = requestAnimationFrame(updateFeatures)
      }
      updateFeatures()
    } catch (err) {
      setInitError('Mobile: Failed to set up audio analysis.')
    }
    // Cleanup
    return () => {
      if (animationFrameMobileRef.current) cancelAnimationFrame(animationFrameMobileRef.current)
      if (analyserNodeRef.current) analyserNodeRef.current.disconnect()
      if (audioContextRef.current) audioContextRef.current.close()
      analyserNodeRef.current = null
      audioContextRef.current = null
    }
  }, [isMobile, selectedFile])

  // Mobile: Track current time
  useEffect(() => {
    if (!isMobile || !audioElementRef.current) return
    const handler = () => setMobileCurrentTime(audioElementRef.current!.currentTime)
    audioElementRef.current.addEventListener('timeupdate', handler)
    return () => audioElementRef.current?.removeEventListener('timeupdate', handler)
  }, [isMobile, selectedFile])

  // Initialize audio context
  const handleInitAudio = async () => {
    try {
      // On mobile, only allow Tone.start() once per session
      if (isMobile && isInitialized) {
        // Already initialized, do nothing
        return
      }
      await Tone.start()
      setIsInitialized(true)
      if (onAudioContextReady) onAudioContextReady(true)
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      setInitError('Failed to initialize audio. Please try again.')
      if (onAudioContextReady) onAudioContextReady(false)
    }
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPath = event.target.value
    if (typeof selectedPath !== 'string' || !selectedPath) return;
    setSelectedFile(selectedPath)
    const audioFile = audioFiles.find(file => file.path && file.path === selectedPath)
    setFileName(audioFile?.name || selectedPath)
    pauseTimeRef.current = 0
    setIsLoading(true)
    onAudioReady?.(false)
    // On mobile, do not reset or re-initialize audio context after initial enable
    if (isMobile && !isInitialized) {
      setInitError('Please tap Enable Audio before selecting a file.')
      setIsLoading(false)
      return
    }
    loadAudioFile(selectedPath)
  }

  // Load audio file
  const loadAudioFile = (filePath: string) => {
    if (isMobile && playerRef.current) {
      // On mobile, reuse the existing player and just load the new file
      setIsLoading(true)
      playerRef.current.load(filePath)
        .then(() => {
          if (playerRef.current && playerRef.current.buffer) {
            onDurationChange?.(playerRef.current.buffer.duration)
          }
          setIsLoading(false)
          onAudioReady?.(true)
          setupAnalysis(playerRef.current!)
        })
        .catch((error: any) => {
          console.error('Mobile: Error loading audio:', error)
          setIsLoading(false)
          onAudioReady?.(false)
          setInitError('Mobile: Error loading audio file. Try reloading the page.')
        })
      return
    }
    // Desktop or first load on mobile
    cleanup()
    isDisposed.current = false
    try {
      // Create player
      const player = new Tone.Player({
        url: filePath,
        autostart: false,
        onload: () => {
          if (player.buffer) {
            onDurationChange?.(player.buffer.duration)
          }
          setIsLoading(false)
          onAudioReady?.(true)
          setupAnalysis(player)
        },
        onerror: (error) => {
          console.error('Error loading audio:', error)
          setIsLoading(false)
          onAudioReady?.(false)
        }
      })
      playerRef.current = player
    } catch (error) {
      console.error('Error creating player:', error)
      setIsLoading(false)
      onAudioReady?.(false)
    }
  }

  // Setup audio analysis
  const setupAnalysis = (player: Tone.Player) => {
    try {
      // Create analyzer
      const analyzer = new Tone.Analyser({
        type: 'waveform',
        size: 1024
      })

      // Connect player to analyzer AND destination
      player.connect(analyzer)
      player.toDestination()
      analyzerRef.current = analyzer

      // Start feature extraction
      const updateFeatures = () => {
        if (isDisposed.current) return

        try {
          const waveform = analyzer.getValue() as Float32Array
          const rms = Math.sqrt(waveform.reduce((sum, val) => sum + val * val, 0) / waveform.length)
          
          // Create audio features
          const audioFeatures: AudioFeatures = {
            rms: rms,
            spectralCentroid: 1000 + rms * 1000,
            spectralRolloff: 2000 + rms * 2000,
            spectralFlatness: 0.5 - rms * 0.3,
            zcr: rms * 10,
            mfcc: new Array(13).fill(rms),
            beat: rms > 0.1,
            bpm: 120 + rms * 60,
            energy: Math.min(1, rms * 5),
            valence: 0.5 + rms * 0.3,
            arousal: rms * 2
          }

          // Debug logging - commented out to reduce console noise
          // if (process.env.NODE_ENV !== 'production') {
          //   console.log('Audio Features:', {
          //     rms: rms.toFixed(4),
          //     energy: audioFeatures.energy.toFixed(4),
          //     bpm: audioFeatures.bpm.toFixed(1),
          //     beat: audioFeatures.beat,
          //     playerState: playerRef.current?.state,
          //     time: ((Date.now() - startTimeRef.current) / 1000).toFixed(1)
          //   })
          // }

          onFeaturesUpdate(audioFeatures)

          if (!isDisposed.current) {
            animationFrameRef.current = requestAnimationFrame(updateFeatures)
          }
        } catch (error) {
          console.error('Feature update error:', error)
          if (!isDisposed.current) {
            animationFrameRef.current = requestAnimationFrame(updateFeatures)
          }
        }
      }

      updateFeatures()
    } catch (error) {
      console.error('Analysis setup error:', error)
      setIsLoading(false)
      onAudioReady?.(false)
    }
  }

  // Toggle playback
  const togglePlayback = async () => {
    if (!playerRef.current || !isInitialized || !selectedFile) return
    // Prevent playback if buffer is not loaded
    if (!playerRef.current.buffer || !playerRef.current.buffer.loaded) {
      setInitError('Audio is still loading. Please wait a moment and try again.')
      return
    }
    try {
      if (isMobile) {
        // Always resume audio context on mobile before playback
        await Tone.context.resume()
      }
      if (playerRef.current.state === 'started') {
        await playerRef.current.stop()
        pauseTimeRef.current = (Date.now() - startTimeRef.current) / 1000 + pauseTimeRef.current
        onPlayStateChange(false)
      } else {
        startTimeRef.current = Date.now()
        await playerRef.current.start(0, pauseTimeRef.current)
        onPlayStateChange(true)
        // Track time
        const updateTime = () => {
          if (isDisposed.current) return
          if (playerRef.current?.state === 'started') {
            const elapsed = (Date.now() - startTimeRef.current) / 1000 + pauseTimeRef.current
            onTimeUpdate(elapsed)
            if (!isDisposed.current) {
              requestAnimationFrame(updateTime)
            }
          }
        }
        updateTime()
      }
    } catch (error) {
      setInitError('Playback error: ' + (error instanceof Error ? error.message : String(error)))
      console.error('Playback error:', error)
      if (isMobile) {
        setInitError('Mobile: Playback error. Try reloading the page and enabling audio again.')
      }
    }
  }

  // --- RENDER ---
  if (isMobile) {
    return (
      <div className={`w-full ${small ? 'max-w-xs p-2 rounded-lg text-xs gap-2' : 'max-w-md md:max-w-lg rounded-xl p-4 md:p-8 gap-4'} bg-gray-900/80 shadow-xl flex flex-col border-2 border-pink-500/30 backdrop-blur-md`}>
        {/* File Selection */}
        <div className={`flex flex-col gap-1 ${small ? '' : 'gap-2'}`}>
          <label className={`font-mono ${small ? 'text-xs mb-0' : 'text-base mb-1'} text-cyan-400 tracking-wider`}>Select Audio File:</label>
          <select
            value={selectedFile}
            onChange={e => {
              setSelectedFile(e.target.value)
              setFileName(audioFiles.find(f => f.path === e.target.value)?.name || e.target.value)
              setIsLoading(true)
              setInitError(null)
              setTimeout(() => setIsLoading(false), 500) // Simulate loading
            }}
            className={`w-full ${small ? 'px-2 py-1 text-xs rounded-md' : 'md:w-96 px-4 py-3 text-lg rounded-lg'} border-2 border-cyan-400 bg-black/80 text-pink-300 font-mono shadow-inner focus:ring-2 focus:ring-pink-400 focus:outline-none neon-glow transition-all duration-200 placeholder-pink-400`}
            style={{
              backgroundImage: 'linear-gradient(90deg, #2d1b69 0%, #1a0033 100%)',
              boxShadow: small ? '0 0 8px #00eaff55, 0 0 16px #ff3ebf33' : '0 0 16px #00eaff55, 0 0 32px #ff3ebf33',
            }}
          >
            <option value="" className="text-gray-400 bg-black/80">🎵 -- Choose an audio file --</option>
            {audioFiles.map((file) => (
              <option key={file.path || ''} value={file.path || ''} className="bg-black/90 text-cyan-300 hover:bg-pink-900">
                {file.name} {file.type ? `(${file.type})` : ''}
              </option>
            ))}
          </select>
          {fileName && (
            <div className={`text-xs text-cyan-200 bg-gray-800/80 p-1 rounded mt-1 font-mono ${small ? 'truncate' : ''}`}>📄 {fileName}</div>
          )}
        </div>
        {/* Audio Element & Controls */}
        {selectedFile && (
          <>
            <audio
              ref={audioElementRef}
              src={selectedFile}
              controls={false}
              preload="auto"
              onLoadedMetadata={e => setMobileDuration(e.currentTarget.duration)}
              onPlay={() => { setIsMobilePlaying(true); setInitError(null); audioContextRef.current?.resume(); onPlayStateChange && onPlayStateChange(true); }}
              onPause={() => { setIsMobilePlaying(false); onPlayStateChange && onPlayStateChange(false); }}
              onEnded={() => { setIsMobilePlaying(false); onPlayStateChange && onPlayStateChange(false); }}
              style={{ width: '100%', marginTop: 8, display: 'none' }}
            />
            <div className="flex flex-row flex-wrap justify-center items-center mt-2 gap-2 w-full">
              {!isMobilePlaying && (
                <button
                  onClick={() => {
                    if (audioElementRef.current) {
                      audioElementRef.current.play()
                      audioContextRef.current?.resume()
                    }
                  }}
                  disabled={isMobilePlaying || isLoading}
                  className="rounded-full bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-600 text-black font-extrabold graffiti-font shadow-lg neon-glow border-2 border-pink-400/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed px-8 py-3 text-xl hover:scale-105 hover:from-pink-400 hover:to-cyan-300"
                >
                  ▶️ Play
                </button>
              )}
              {isMobilePlaying && (
                <button
                  onClick={() => audioElementRef.current?.pause()}
                  className="rounded-full bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-600 text-black font-extrabold graffiti-font shadow-lg neon-glow border-2 border-pink-400/60 transition-all duration-200 px-8 py-3 text-xl hover:scale-105 hover:from-pink-400 hover:to-cyan-300"
                >
                  ⏸️ Pause
                </button>
              )}
              {(isMobilePlaying || mobileCurrentTime > 0) && (
                <button
                  onClick={() => {
                    if (audioElementRef.current) {
                      audioElementRef.current.currentTime = 0
                      setMobileCurrentTime(0)
                      if (!audioElementRef.current.paused) {
                        audioElementRef.current.play()
                      }
                    }
                  }}
                  className="rounded-full bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-600 text-black font-extrabold graffiti-font shadow-lg neon-glow border-2 border-pink-400/60 transition-all duration-200 hover:scale-105 px-4 py-2 text-sm"
                  title="Reset to beginning"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="text-cyan-300 font-mono text-center mt-2">
              {Math.floor(mobileCurrentTime)} / {Math.floor(mobileDuration)} sec
            </div>
          </>
        )}
        {isLoading && (
          <div className="flex flex-col items-center justify-center mt-2 mb-2">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400 mb-2" />
            <div className="text-cyan-300 font-mono text-sm">Loading audio file, please wait...</div>
          </div>
        )}
        {initError && (
          <div className="text-pink-400 font-mono text-sm mt-2">{initError}</div>
        )}
      </div>
    )
  }
  // Desktop rendering
  return (
    <div className={`w-full ${small ? 'max-w-xs p-2 rounded-lg text-xs gap-2' : 'max-w-md md:max-w-lg rounded-xl p-4 md:p-8 gap-4'} bg-gray-900/80 shadow-xl flex flex-col border-2 border-pink-500/30 backdrop-blur-md`}>
      {/* Audio Context Initialization */}
      {!isInitialized && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-400 mb-3" />
          <div className="text-cyan-300 font-mono text-base mb-2">Initializing audio engine...</div>
          <button
            onClick={handleInitAudio}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-600 text-black font-extrabold graffiti-font shadow-lg neon-glow border-2 border-pink-400/60 hover:scale-105 transition-all duration-200"
          >
            Enable Audio
          </button>
          {initError && (
            <div className="text-pink-400 font-mono text-sm mt-2">{initError}</div>
          )}
        </div>
      )}

      {/* File Selection */}
      <div className={`flex flex-col gap-1 ${small ? '' : 'gap-2'} ${!isInitialized ? 'opacity-50 pointer-events-none' : ''}`}> 
        <label className={`font-mono ${small ? 'text-xs mb-0' : 'text-base mb-1'} text-cyan-400 tracking-wider`}>Select Audio File:</label>
        <select
          value={selectedFile}
          onChange={handleFileSelect}
          disabled={!isInitialized}
          className={`w-full ${small ? 'px-2 py-1 text-xs rounded-md' : 'md:w-96 px-4 py-3 text-lg rounded-lg'} border-2 border-cyan-400 bg-black/80 text-pink-300 font-mono shadow-inner focus:ring-2 focus:ring-pink-400 focus:outline-none neon-glow transition-all duration-200 placeholder-pink-400`}
          style={{
            backgroundImage: 'linear-gradient(90deg, #2d1b69 0%, #1a0033 100%)',
            boxShadow: small ? '0 0 8px #00eaff55, 0 0 16px #ff3ebf33' : '0 0 16px #00eaff55, 0 0 32px #ff3ebf33',
          }}
        >
          <option value="" className="text-gray-400 bg-black/80">🎵 -- Choose an audio file --</option>
          {audioFiles.map((file) => (
            <option key={file.path || ''} value={file.path || ''} className="bg-black/90 text-cyan-300 hover:bg-pink-900">
              {file.name} {file.type ? `(${file.type})` : ''}
            </option>
          ))}
        </select>
        {fileName && (
          <div className={`text-xs text-cyan-200 bg-gray-800/80 p-1 rounded mt-1 font-mono ${small ? 'truncate' : ''}`}>📄 {fileName}</div>
        )}
      </div>

      {/* Loading State */}
      {isInitialized && isLoading && (
        <div className="flex flex-col items-center justify-center mt-2 mb-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-400 mb-2" />
          <div className="text-cyan-300 font-mono text-sm">Loading audio file, please wait...</div>
        </div>
      )}

      {/* Play/Pause Button */}
      <div className="flex justify-center mt-1 gap-2">
        <button
          onClick={togglePlayback}
          disabled={!isInitialized || isLoading || !selectedFile || !playerRef.current || !playerRef.current.buffer || !playerRef.current.buffer.loaded}
          className={`rounded-full bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-600 text-black font-extrabold graffiti-font shadow-lg neon-glow border-2 border-pink-400/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${small ? 'px-4 py-1 text-base' : 'px-8 py-3 text-xl'} ${small ? 'hover:scale-100' : 'hover:scale-105 hover:from-pink-400 hover:to-cyan-300'}`}
        >
          {isLoading ? '⏳' : playerRef.current?.state === 'started' ? '⏸️ Pause' : '▶️ Play'}
        </button>
        {playerRef.current?.state === 'started' && (
          <button
            onClick={async () => {
              if (playerRef.current) {
                await playerRef.current.stop()
                pauseTimeRef.current = 0
                onTimeUpdate(0)
                startTimeRef.current = Date.now()
                await playerRef.current.start(0, 0)
              }
            }}
            className={`rounded-full bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-600 text-black font-extrabold graffiti-font shadow-lg neon-glow border-2 border-pink-400/60 transition-all duration-200 hover:scale-105 ${small ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'}`}
            title="Reset to beginning"
          >
            Reset
          </button>
        )}
      </div>

      {/* Status Messages */}
      {isInitialized && !selectedFile && !isLoading && (
        <div className="text-pink-300 font-mono text-center mt-2">Select a track to begin.</div>
      )}
      {isInitialized && selectedFile && !isLoading && playerRef.current?.state !== 'started' && (
        <div className="text-cyan-300 font-mono text-center mt-2">Hit play to start the visualizer!</div>
      )}
    </div>
  )
}

export default AudioController 