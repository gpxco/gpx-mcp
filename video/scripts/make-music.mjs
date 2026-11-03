// Synthesizes the background music (public/music.wav): a mellow lounge loop of electric piano,
// walking bass, vibraphone and brushes, generated here so there is no licence to track.
import { writeFile } from 'node:fs/promises';

const SECONDS = Number(process.argv[2] ?? 61);
const RATE = 44100;
const BPM = 92;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const n = Math.ceil(SECONDS * RATE);
const left = new Float32Array(n);
const right = new Float32Array(n);

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Deterministic so every render produces the same track.
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function note({ at, length, midi, gain, pan = 0, voice }) {
  const start = Math.floor(at * RATE);
  const end = Math.min(n, start + Math.floor((length + 1.2) * RATE));
  const f = hz(midi);
  const l = gain * (1 - pan) * 0.5;
  const r = gain * (1 + pan) * 0.5;
  for (let i = start; i < end; i++) {
    const t = (i - start) / RATE;
    const release = t > length ? Math.exp(-(t - length) * 6) : 1;
    let s;
    if (voice === 'piano') {
      const env = Math.min(1, t * 200) * Math.exp(-t * 1.6) * release;
      const tremolo = 1 - 0.18 * (1 + Math.sin(2 * Math.PI * 4.5 * t)) / 2;
      s = (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(4 * Math.PI * f * t) * Math.exp(-t * 4)) * env * tremolo;
    } else if (voice === 'bass') {
      const env = Math.min(1, t * 300) * Math.exp(-t * 2.2) * release;
      s = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * env;
    } else {
      const env = Math.min(1, t * 400) * Math.exp(-t * 1.1) * release;
      const tremolo = 1 - 0.35 * (1 + Math.sin(2 * Math.PI * 5.5 * t)) / 2;
      s = (Math.sin(2 * Math.PI * f * t) + 0.12 * Math.sin(2 * Math.PI * f * 4 * t) * Math.exp(-t * 8)) * env * tremolo;
    }
    left[i] += s * l;
    right[i] += s * r;
  }
}

function brush(at, gain) {
  const start = Math.floor(at * RATE);
  const end = Math.min(n, start + Math.floor(0.18 * RATE));
  let lp = 0;
  for (let i = start; i < end; i++) {
    const t = (i - start) / RATE;
    const noise = rand() * 2 - 1;
    lp += 0.35 * (noise - lp);
    const s = (noise - lp) * Math.exp(-t * 28) * gain;
    left[i] += s * 0.8;
    right[i] += s;
  }
}

// Cmaj7 | Am7 | Dm7 | G7, two bars each.
const chords = [
  { root: 48, tones: [52, 55, 59, 64], scale: [60, 62, 64, 67, 69, 71, 72] },
  { root: 45, tones: [52, 55, 60, 64], scale: [60, 64, 67, 69, 72, 76] },
  { root: 50, tones: [53, 57, 60, 65], scale: [62, 65, 69, 72, 74, 77] },
  { root: 43, tones: [53, 55, 59, 65], scale: [62, 65, 67, 71, 74, 77] },
];
const walk = [0, 4, 7, 9, 12, 9, 7, 4];

for (let bar = 0; bar * BAR < SECONDS; bar++) {
  const chord = chords[Math.floor(bar / 2) % chords.length];
  const t0 = bar * BAR;
  for (const [beat, len] of [[0, 1.4], [1.5, 0.9], [2.5, 1.3]]) {
    chord.tones.forEach((m, k) => note({ at: t0 + beat * BEAT + k * 0.012, length: len * BEAT, midi: m, gain: 0.11, pan: -0.25, voice: 'piano' }));
  }
  for (let beat = 0; beat < 4; beat++) {
    note({ at: t0 + beat * BEAT, length: BEAT * 0.9, midi: chord.root + walk[(bar % 2) * 4 + beat] - 12, gain: 0.32, voice: 'bass' });
    if (beat % 2 === 1) brush(t0 + beat * BEAT, 0.05);
    brush(t0 + (beat + 0.66) * BEAT, 0.02);
  }
  if (bar % 4 !== 3) {
    for (const beat of [0, 1, 1.5, 3]) {
      if (rand() < 0.3) continue;
      const m = chord.scale[Math.floor(rand() * chord.scale.length)] + 12;
      note({ at: t0 + beat * BEAT, length: BEAT * 0.8, midi: m, gain: 0.07, pan: 0.35, voice: 'vibes' });
    }
  }
}

// Fade in and out, normalise, write 16-bit stereo PCM.
const fadeIn = RATE * 1.5;
const fadeOut = RATE * 3;
let peak = 0;
for (let i = 0; i < n; i++) {
  const g = Math.min(1, i / fadeIn, (n - i) / fadeOut);
  left[i] *= g;
  right[i] *= g;
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
const scale = 0.89 / peak;
const data = Buffer.alloc(n * 4);
for (let i = 0; i < n; i++) {
  data.writeInt16LE(Math.round(Math.tanh(left[i] * scale) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.tanh(right[i] * scale) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(RATE, 24);
header.writeUInt32LE(RATE * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
await writeFile(new URL('../public/music.wav', import.meta.url), Buffer.concat([header, data]));
console.log(`Wrote public/music.wav (${SECONDS}s)`);
