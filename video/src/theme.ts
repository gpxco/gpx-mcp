import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';

export const sans = loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily;
export const mono = loadMono('normal', { weights: ['400', '600'], subsets: ['latin'] }).fontFamily;

export const color = {
  red: '#F25A54',
  navy: '#1d2e30',
  white: '#ffffff',
  light: '#f8f9fa',
  text: '#1f2937',
  muted: '#6b7280',
  green: '#059669',
  blue: '#2563eb',
  terminal: '#0f1a1c',
};

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
