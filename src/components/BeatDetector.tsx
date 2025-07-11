import React from 'react'
import { AudioFeatures } from '../types/audio'

interface BeatDetectorProps {
  audioFeatures: AudioFeatures
  isPlaying: boolean
}

const BeatDetector: React.FC<BeatDetectorProps> = ({ audioFeatures, isPlaying }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-mono text-pink-400">Beat Detector</h3>
        
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Energy:</span>
            <span className="text-yellow-400">{Math.round(audioFeatures.energy * 100)}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">BPM:</span>
            <span className="text-green-400">{Math.round(audioFeatures.bpm)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={isPlaying ? 'text-cyan-400' : 'text-gray-400'}>
              {isPlaying ? 'Playing' : 'Stopped'}
            </span>
          </div>
        </div>
        
        {/* Beat indicator */}
        <div className={`w-full h-2 rounded-full transition-all duration-100 ${
          audioFeatures.beat 
            ? 'bg-pink-500 shadow-lg shadow-pink-500/50' 
            : 'bg-gray-600'
        }`} />
        
        {/* Audio features visualization */}
        <div className="flex gap-1 h-8">
          {audioFeatures.mfcc.slice(0, 8).map((value, index) => (
            <div
              key={index}
              className="flex-1 bg-gradient-to-t from-gray-700 to-gray-500 rounded"
              style={{
                height: `${Math.max(10, value * 100)}%`,
                backgroundColor: audioFeatures.beat ? '#ff00ff' : '#666'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default BeatDetector 