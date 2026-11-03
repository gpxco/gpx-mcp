import React from 'react';
import { Audio, Series, staticFile } from 'remotion';
import { Fade } from './components';
import { ClaudeCode, CopyToken, CreateToken, DesktopConfig, Intro, NameToken, OpenApiAccess, Outro, StepOne, StepTwo, Teaser, TryIt, Writes } from './scenes';

export const SCENES: [React.FC, number][] = [
  [Intro, 105],
  [Teaser, 190],
  [StepOne, 55],
  [OpenApiAccess, 95],
  [CreateToken, 85],
  [NameToken, 120],
  [CopyToken, 160],
  [StepTwo, 55],
  [ClaudeCode, 200],
  [DesktopConfig, 200],
  [Writes, 165],
  [TryIt, 270],
  [Outro, 120],
];

export const TOTAL_FRAMES = SCENES.reduce((sum, [, d]) => sum + d, 0);

export const Setup: React.FC = () => (
  <>
  <Audio src={staticFile('music.wav')} volume={0.3} />
  <Series>
    {SCENES.map(([Scene, duration], i) => (
      <Series.Sequence key={i} durationInFrames={duration}>
        <Fade>
          <Scene />
        </Fade>
      </Series.Sequence>
    ))}
  </Series>
  </>
);
