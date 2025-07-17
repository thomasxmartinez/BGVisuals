import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const API_KEY = process.env.VITE_ASSEMBLYAI_API_KEY || 'a13d7f9736e54c10beb5bbb2c6109f48';
const AUDIO_FILE = path.join(__dirname, 'public/audio/Ballads_4_Baddies_Final.mp3');
const OUTPUT_JSON = path.join(__dirname, 'public/audio/ballads_4_baddies_transcript.json');

async function uploadFile(filePath) {
  const fileData = fs.readFileSync(filePath);
  const res = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: { 'authorization': API_KEY },
    body: fileData
  });
  const data = await res.json();
  return data.upload_url;
}

async function requestTranscription(audioUrl) {
  const res = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'authorization': API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      punctuate: true,
      format_text: true,
      word_boost: ['ballads', 'baddies', 'synthwave', 'neon', 'electric', 'retro', 'cyber']
    })
  });
  const data = await res.json();
  return data.id;
}

async function pollTranscription(transcriptId) {
  while (true) {
    const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { 'authorization': API_KEY }
    });
    const data = await res.json();
    if (data.status === 'completed') return data;
    if (data.status === 'failed') throw new Error('Transcription failed');
    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function main() {
  try {
    console.log('🎵 Starting transcription...');
    const audioUrl = await uploadFile(AUDIO_FILE);
    console.log('\n📤 Audio uploaded:', audioUrl);
    const transcriptId = await requestTranscription(audioUrl);
    console.log('\n📝 Transcription requested, id:', transcriptId);
    const transcript = await pollTranscription(transcriptId);
    console.log('\n🎯 Transcription completed!');
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(transcript, null, 2));
    console.log(`\nTranscript saved to ${OUTPUT_JSON}`);
    console.log('\nFirst 500 chars:', transcript.text.slice(0, 500));
  } catch (err) {
    console.error('\n❌ Error:', err);
  }
}

main(); 