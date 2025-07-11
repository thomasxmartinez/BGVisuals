export interface AudioFeatures {
  rms: number
  spectralCentroid: number
  spectralRolloff: number
  spectralFlatness: number
  zcr: number
  mfcc: number[]
  beat: boolean
  bpm: number
  energy: number
  valence: number
  arousal: number
}

export interface BeatInfo {
  time: number
  confidence: number
  strength: number
}

export interface OnsetInfo {
  time: number
  strength: number
  frequency: number
}

export interface SceneConfig {
  id: number
  name: string
  colors: string[]
  shapes: string[]
  effects: string[]
  code: string
} 