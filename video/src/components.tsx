import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { color, mono, sans } from './theme';

export const Fade: React.FC<{ children: React.ReactNode; inFrames?: number; outFrames?: number }> = ({ children, inFrames = 10, outFrames = 10 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = Math.min(
    interpolate(frame, [0, inFrames], [0, 1], { extrapolateRight: 'clamp' }),
    interpolate(frame, [durationInFrames - outFrames, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' }),
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const Caption: React.FC<{ text: string; delay?: number; tone?: 'light' | 'dark' }> = ({ text, delay = 8, tone = 'dark' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 56,
        display: 'flex',
        justifyContent: 'center',
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
      }}
    >
      <div
        style={{
          fontFamily: sans,
          fontSize: 38,
          fontWeight: 600,
          color: tone === 'dark' ? color.white : color.navy,
          background: tone === 'dark' ? color.navy : color.white,
          padding: '18px 36px',
          borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          maxWidth: 1500,
          textAlign: 'center',
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const StepTitle: React.FC<{ step: string; title: string }> = ({ step, title }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: color.navy, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontFamily: sans, textAlign: 'center', opacity: p, transform: `scale(${0.96 + p * 0.04})` }}>
        <div style={{ fontSize: 34, fontWeight: 600, color: color.red, letterSpacing: 4, textTransform: 'uppercase' }}>{step}</div>
        <div style={{ fontSize: 88, fontWeight: 700, color: color.white, marginTop: 16 }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
};

type Box = { x: number; y: number; w: number; h: number };
export type Highlight = Box & { from: number; to?: number };

// A screenshot in a browser frame. `focus` zooms the camera towards a point of the image over the scene;
// highlights draw a red ring around a region (image pixels) while the current frame is within [from, to).
export const Shot: React.FC<{
  src: string;
  width: number;
  height: number;
  url: string;
  focus?: { x: number; y: number; zoom: number; at?: [number, number] };
  highlights?: Highlight[];
  overlay?: React.ReactNode;
}> = ({ src, width, height, url, focus, highlights = [], overlay }) => {
  const frame = useCurrentFrame();
  const frameWidth = 1640;
  const scale = frameWidth / width;
  const shownHeight = height * scale;
  const [zStart, zEnd] = focus?.at ?? [0, 45];
  const z = focus ? interpolate(frame, [zStart, zEnd], [1, focus.zoom], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }) : 1;
  const originX = focus ? focus.x * scale : frameWidth / 2;
  const originY = focus ? focus.y * scale : shownHeight / 2;
  return (
    <AbsoluteFill style={{ background: color.light, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: frameWidth, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', background: color.white, marginTop: -60 }}>
        <div style={{ height: 52, background: '#e9ecef', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
          ))}
          <div style={{ marginLeft: 24, flex: 1, height: 32, borderRadius: 8, background: color.white, fontFamily: sans, fontSize: 18, color: color.muted, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            {url}
          </div>
        </div>
        <div style={{ position: 'relative', width: frameWidth, height: shownHeight, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, transform: `scale(${z})`, transformOrigin: `${originX}px ${originY}px` }}>
            <Img src={staticFile(src)} style={{ width: frameWidth, height: shownHeight, display: 'block' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, width, height, transform: `scale(${scale})`, transformOrigin: '0 0' }}>
              {overlay}
              {highlights.map((h, i) => {
                const visible = frame >= h.from && (h.to === undefined || frame < h.to);
                if (!visible) return null;
                const pulse = 1 + 0.04 * Math.sin((frame - h.from) / 5);
                const appear = interpolate(frame - h.from, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: h.x - 8,
                      top: h.y - 8,
                      width: h.w + 16,
                      height: h.h + 16,
                      border: `4px solid ${color.red}`,
                      borderRadius: 10,
                      boxShadow: '0 0 24px rgba(242,90,84,0.45)',
                      opacity: appear,
                      transform: `scale(${pulse})`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Typed: React.FC<{ text: string; start: number; cps?: number; style?: React.CSSProperties; cursor?: boolean }> = ({ text, start, cps = 40, style, cursor = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = Math.max(0, Math.floor(((frame - start) / fps) * cps));
  const done = chars >= text.length;
  const blink = Math.floor(frame / 15) % 2 === 0;
  return (
    <span style={style}>
      {text.slice(0, chars)}
      {cursor && frame >= start && (!done || blink) ? (
        <span style={{ display: 'inline-block', width: '0.55em', height: '1.1em', background: 'currentColor', opacity: 0.7, verticalAlign: 'text-bottom', marginLeft: 2 }} />
      ) : null}
    </span>
  );
};

export const Window: React.FC<{ title: string; dark?: boolean; width?: number; children: React.ReactNode }> = ({ title, dark, width = 1500, children }) => (
  <div style={{ width, borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', background: dark ? color.terminal : color.white }}>
    <div style={{ height: 52, background: dark ? '#1f2b2d' : '#e9ecef', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10 }}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
      ))}
      <div style={{ flex: 1, textAlign: 'center', fontFamily: sans, fontSize: 20, color: dark ? '#9aa5a7' : color.muted, marginRight: 62 }}>{title}</div>
    </div>
    {children}
  </div>
);

export const codeStyle: React.CSSProperties = { fontFamily: mono, fontSize: 30, lineHeight: 1.6, whiteSpace: 'pre' };
