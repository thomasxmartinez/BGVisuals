import 'dotenv/config';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs';

// Replace with your actual API key from AssemblyAI dashboard
const API_KEY = process.env.VITE_ASSEMBLYAI_API_KEY || 'a13d7f9736e54c10beb5bbb2c6109f48';

const client = new AssemblyAI({ apiKey: API_KEY });

async function transcribeAudio(audioFile) {
  try {
    console.log('🎵 Starting transcription...');
    
    // Upload the audio file
    const audio = await client.files.upload(audioFile);
    console.log('📤 Audio uploaded successfully');
    console.log('Audio upload result:', audio);
    
    // Use the correct property for the audio URL
    const audioUrl = audio.upload_url || audio.url || audio.audio_url || audio;
    console.log('Using audio URL:', audioUrl);
    
    // Create transcription request
    const transcript = await client.transcripts.create({
      audio: audioUrl,
      word_boost: ['ballads', 'baddies', 'synthwave', 'neon', 'electric', 'retro', 'cyber'],
      punctuate: true,
      format_text: true
    });
    
    console.log('🎯 Transcription completed!');
    console.log('\n📝 Full transcript:');
    console.log(transcript.text);
    
    // Save transcript to JSON file
    fs.writeFileSync('./public/audio/ballads_4_baddies_transcript.json', JSON.stringify(transcript, null, 2));
    console.log('\n💾 Transcript saved to ./public/audio/ballads_4_baddies_transcript.json');
    
    return transcript;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Use the smallest mp3 for all Ballads_4_Baddies variants
const audioFile = './public/audio/Ballads_4_Baddies_Final.mp3';
transcribeAudio(audioFile); 