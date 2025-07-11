import React, { useRef, useEffect, useState } from 'react';
import Meyda from 'meyda';
import { AudioFeatures } from '../types/audio';

interface AudioControllerMeydaProps {
  onFeaturesUpdate: (features: AudioFeatures) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onAudioReady: (ready: boolean) => void;
  small?: boolean;
}

const AVAILABLE_AUDIO_FILES = [
  {
    name: 'Ballads 4 Baddies [No Tags].mp3',
    path: '/audio/Ballads_4_Baddies_No_Tags.mp3',
    size: '158 MB',
    type: 'MP3',
    description: 'Fast loading, compressed',
  },
  {
    name: 'Ballads 4 Baddies [No Tags].wav',
    path: '/audio/Ballads_4_Baddies_No_Tags.wav',
    size: '1.4 GB',
    type: 'WAV',
    description: 'Original quality, slower loading',
  },
];

const AudioControllerMeyda: React.FC<AudioControllerMeydaProps> = ({
  onFeaturesUpdate,
  onPlayStateChange,
  onTimeUpdate,
  onDurationChange,
  onAudioReady,
  small = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [meydaAnalyzer, setMeydaAnalyzer] = useState<any>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPath = event.target.value;
    if (selectedPath) {
      setSelectedFile(selectedPath);
      const audioFile = AVAILABLE_AUDIO_FILES.find((file) => file.path === selectedPath);
      setFileName(audioFile?.name || selectedPath);
      setIsReady(false);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.src = selectedPath;
        audioRef.current.load();
      }
      onAudioReady(false);
    }
  };

  // Setup Meyda analyzer
  useEffect(() => {
    if (!audioRef.current) return;
    let analyzer: any = null;
    let audioCtx: AudioContext | null = null;
    let source: MediaElementAudioSourceNode | null = null;
    let rafId: number | null = null;

    const startMeyda = () => {
      if (meydaAnalyzer) {
        meydaAnalyzer.stop();
      }
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      source = audioCtx.createMediaElementSource(audioRef.current!);
      analyzer = Meyda.createMeydaAnalyzer({
        audioContext: audioCtx,
        source: source,
        bufferSize: 512,
        featureExtractors: [
          'rms',
          'spectralCentroid',
          'spectralRolloff',
          'spectralFlatness',
          'zcr',
          'mfcc',
        ],
        callback: (features: any) => {
          const audioFeatures: AudioFeatures = {
            rms: features.rms || 0,
            spectralCentroid: features.spectralCentroid || 0,
            spectralRolloff: features.spectralRolloff || 0,
            spectralFlatness: features.spectralFlatness || 0,
            zcr: features.zcr || 0,
            mfcc: features.mfcc || new Array(13).fill(0),
            beat: features.rms > 0.1, // crude beat detection
            bpm: 120 + (features.rms || 0) * 60, // fake bpm for now
            energy: Math.min(1, (features.rms || 0) * 5),
            valence: 0.5 + (features.rms || 0) * 0.3,
            arousal: (features.rms || 0) * 2,
          };
          onFeaturesUpdate(audioFeatures);
        },
      });
      analyzer.start();
      setMeydaAnalyzer(analyzer);
      onAudioReady(true);
    };

    if (isReady && selectedFile) {
      startMeyda();
    }

    return () => {
      if (analyzer) analyzer.stop();
      if (audioCtx) audioCtx.close();
      if (rafId) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line
  }, [isReady, selectedFile]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      onDurationChange(audio.duration);
      setIsReady(true);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate(audio.currentTime);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      onPlayStateChange(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPlayStateChange(false);
    };
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
    // eslint-disable-next-line
  }, []);

  // Play/pause controls
  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div className={`w-full ${small ? 'max-w-xs p-2 rounded-lg text-xs gap-2' : 'max-w-md md:max-w-lg rounded-xl p-4 md:p-8 gap-4'} bg-gray-900/80 shadow-xl flex flex-col border-2 border-pink-500/30 backdrop-blur-md`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} preload="auto" />
      {/* File Selection */}
      <div className={`flex flex-col gap-1 ${small ? '' : 'gap-2'}`}> 
        <label className={`font-mono ${small ? 'text-xs mb-0' : 'text-base mb-1'} text-cyan-400 tracking-wider`}>Select Audio File:</label>
        <select
          value={selectedFile}
          onChange={handleFileSelect}
          className={`w-full ${small ? 'px-2 py-1 text-xs rounded-md' : 'md:w-96 px-4 py-3 text-lg rounded-lg'} border-2 border-cyan-400 bg-black/80 text-pink-300 font-mono shadow-inner focus:ring-2 focus:ring-pink-400 focus:outline-none neon-glow transition-all duration-200 placeholder-pink-400`}
          style={{
            backgroundImage: 'linear-gradient(90deg, #2d1b69 0%, #1a0033 100%)',
            boxShadow: small ? '0 0 8px #00eaff55, 0 0 16px #ff3ebf33' : '0 0 16px #00eaff55, 0 0 32px #ff3ebf33',
          }}
        >
          <option value="" className="text-gray-400 bg-black/80">🎵 -- Choose an audio file --</option>
          {AVAILABLE_AUDIO_FILES.map((file) => (
            <option key={file.path} value={file.path} className="bg-black/90 text-cyan-300 hover:bg-pink-900">
              {file.name} ({file.size}, {file.type}) - {file.description}
            </option>
          ))}
        </select>
        {fileName && (
          <div className={`text-xs text-cyan-200 bg-gray-800/80 p-1 rounded mt-1 font-mono ${small ? 'truncate' : ''}`}>📄 {fileName}</div>
        )}
      </div>
      {/* Play/Pause Button */}
      <div className="flex justify-center mt-1">
        <button
          onClick={togglePlayback}
          disabled={!isReady}
          className={`rounded-full bg-gradient-to-r from-pink-500 via-cyan-400 to-purple-600 text-black font-extrabold graffiti-font shadow-lg neon-glow border-2 border-pink-400/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${small ? 'px-4 py-1 text-base' : 'px-8 py-3 text-xl'} ${small ? 'hover:scale-100' : 'hover:scale-105 hover:from-pink-400 hover:to-cyan-300'}`}
        >
          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
        </button>
      </div>
      {/* Status Info */}
      <div className="text-xs text-gray-400 space-y-1 mt-2">
        <div>Status: {isReady ? (isPlaying ? 'Playing' : 'Ready') : 'Loading...'}</div>
        {fileName && <div>File: {fileName}</div>}
        <div>Time: {currentTime.toFixed(1)} / {duration.toFixed(1)} sec</div>
      </div>
    </div>
  );
};

export default AudioControllerMeyda; 