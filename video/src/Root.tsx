import React from 'react';
import { Composition } from 'remotion';
import { Setup, TOTAL_FRAMES } from './Setup';
import { FPS, HEIGHT, WIDTH } from './theme';

export const Root: React.FC = () => (
  <Composition id="Setup" component={Setup} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
