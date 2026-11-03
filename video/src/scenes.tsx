import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Caption, codeStyle, Shot, StepTitle, Typed, Window } from './components';
import { color, mono, sans } from './theme';

const APP_SHOT = { width: 1509, height: 812 };
const TRACKER_SHOT = { width: 1384, height: 797 };

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 200 } });
  const text = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: color.navy, justifyContent: 'center', alignItems: 'center' }}>
      <Img src={staticFile('gpx-logo-white.svg')} style={{ width: 300, opacity: logo, transform: `translateY(${(1 - logo) * 20}px)` }} />
      <div style={{ fontFamily: sans, textAlign: 'center', marginTop: 56, opacity: text, transform: `translateY(${(1 - text) * 20}px)` }}>
        <div style={{ fontSize: 76, fontWeight: 700, color: color.white }}>Connect your AI assistant to GPX</div>
        <div style={{ fontSize: 38, color: '#b7c2c4', marginTop: 20 }}>Claude, Cursor or any MCP client. Two steps, two minutes.</div>
      </div>
    </AbsoluteFill>
  );
};

const Bubble: React.FC<{ who: 'you' | 'assistant'; children: React.ReactNode; appear: number }> = ({ who, children, appear }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appear, fps, config: { damping: 200 } });
  const mine = who === 'you';
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', opacity: p, transform: `translateY(${(1 - p) * 16}px)`, marginBottom: 28 }}>
      <div
        style={{
          maxWidth: 1080,
          fontFamily: sans,
          fontSize: 34,
          lineHeight: 1.5,
          color: color.text,
          background: mine ? '#eef1f2' : 'transparent',
          padding: mine ? '18px 28px' : '4px 0',
          borderRadius: 18,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const ToolChip: React.FC<{ label: string; appear: number }> = ({ label, appear }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - appear, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ opacity, display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: sans, fontSize: 24, color: color.muted, border: '1px solid #dfe3e5', borderRadius: 10, padding: '8px 16px', marginBottom: 20 }}>
      <span style={{ width: 10, height: 10, borderRadius: 5, background: color.green }} />
      {label}
    </div>
  );
};

const Chat: React.FC<{ question: string; tool: string; answer: React.ReactNode; answerAt: number }> = ({ question, tool, answer, answerAt }) => (
  <AbsoluteFill style={{ background: color.light, justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ marginTop: -40 }}>
      <Window title="Your AI assistant" width={1400}>
        <div style={{ padding: '44px 60px', height: 620 }}>
          <Bubble who="you" appear={4}>{question}</Bubble>
          <ToolChip label={tool} appear={answerAt - 18} />
          <Bubble who="assistant" appear={answerAt}>{answer}</Bubble>
        </div>
      </Window>
    </div>
  </AbsoluteFill>
);

export const Teaser: React.FC = () => (
  <>
    <Chat
      question="Which of my trackers haven't reported recently?"
      tool="GPX · list_devices"
      answerAt={40}
      answer={
        <>
          Two of your four trackers have gone quiet:
          <br />• <b>Forklift 3</b>, last seen 5 months ago
          <br />• <b>Pallet 42</b>, last seen 23 days ago
        </>
      }
    />
    <Caption text="Ask about your trackers, shipments and geofences in plain words." delay={70} />
  </>
);

export const StepOne: React.FC = () => <StepTitle step="Step 1" title="Create an API token" />;
export const StepTwo: React.FC = () => <StepTitle step="Step 2" title="Add GPX to your assistant" />;

export const OpenApiAccess: React.FC = () => (
  <>
    <Shot src="shots/settings.jpg" {...APP_SHOT} url="app.gpx.co/settings" highlights={[{ x: 316, y: 392, w: 157, h: 22, from: 15 }]} />
    <Caption text="In the GPX app, open Settings › API Access" />
  </>
);

export const CreateToken: React.FC = () => (
  <>
    <Shot src="shots/api-access.jpg" {...APP_SHOT} url="app.gpx.co/settings/api" highlights={[{ x: 1124, y: 213, w: 76, h: 22, from: 10 }]} />
    <Caption text="Click Create token" />
  </>
);

export const NameToken: React.FC = () => {
  const frame = useCurrentFrame();
  const src = frame < 40 ? 'shots/create-empty.jpg' : 'shots/create-filled.jpg';
  return (
    <>
      <Shot
        src={src}
        {...APP_SHOT}
        url="app.gpx.co/settings/api"
        focus={{ x: 754, y: 390, zoom: 1.35, at: [0, 30] }}
        highlights={[
          { x: 560, y: 351, w: 388, h: 38, from: 10, to: 60 },
          { x: 560, y: 504, w: 128, h: 37, from: 60 },
        ]}
      />
      <Caption text="Name it after where you'll use it, e.g. “Claude”, then Create token" />
    </>
  );
};

export const CopyToken: React.FC = () => {
  const frame = useCurrentFrame();
  const copied = frame >= 55;
  return (
    <>
      <Shot
        src="shots/token-created.jpg"
        {...APP_SHOT}
        url="app.gpx.co/settings/api"
        focus={{ x: 754, y: 390, zoom: 1.35, at: [0, 1] }}
        highlights={[{ x: 560, y: 413, w: 72, h: 31, from: 25 }]}
        overlay={
          <>
            <div style={{ position: 'absolute', left: 578, top: 372, fontFamily: mono, fontSize: 13, color: '#1f2937', letterSpacing: 0.5 }}>
              gpx_live_••••••••••••••••••••••••••••••••
            </div>
            {copied ? (
              <div style={{ position: 'absolute', left: 561, top: 414, width: 70, height: 29, background: '#fff', borderRadius: 4, fontFamily: sans, fontSize: 11, fontWeight: 500, color: color.green, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Copied
              </div>
            ) : null}
          </>
        }
      />
      <Caption text="Copy it now: it's shown only once. Treat it like a password." />
    </>
  );
};

const CLAUDE_CODE = 'claude mcp add gpx --env GPX_API_TOKEN=gpx_live_... -- npx -y @gpxco/mcp';

export const ClaudeCode: React.FC = () => {
  const frame = useCurrentFrame();
  const doneAt = 20 + Math.ceil((CLAUDE_CODE.length / 40) * 30);
  const ok = interpolate(frame, [doneAt + 10, doneAt + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: color.light, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ marginTop: -80 }}>
        <div style={{ fontFamily: sans, fontSize: 40, fontWeight: 700, color: color.navy, marginBottom: 28 }}>Claude Code</div>
        <Window title="Terminal" dark width={1640}>
          <div style={{ padding: '40px 48px', height: 300, color: '#e6edf3', ...codeStyle, fontSize: 28, whiteSpace: 'pre-wrap' }}>
            <span style={{ color: color.red }}>$ </span>
            <Typed text={CLAUDE_CODE} start={20} />
            <div style={{ opacity: ok, color: '#7ee2a8', marginTop: 24 }}>Added stdio MCP server gpx</div>
          </div>
        </Window>
      </div>
      <Caption text="One command. Paste your token in place of gpx_live_..." delay={doneAt} />
    </AbsoluteFill>
  );
};

const Json: React.FC<{ writes?: number }> = ({ writes }) => {
  const frame = useCurrentFrame();
  const show = writes === undefined ? 0 : interpolate(frame, [writes, writes + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const key = { color: '#9cdcfe' };
  const str = { color: '#ce9178' };
  const pun = { color: '#d4d4d4' };
  return (
    <div style={{ ...codeStyle, color: '#d4d4d4', padding: '36px 48px' }}>
      <span style={pun}>{'{'}</span>
      {'\n  '}<span style={key}>"mcpServers"</span>: {'{'}
      {'\n    '}<span style={key}>"gpx"</span>: {'{'}
      {'\n      '}<span style={key}>"command"</span>: <span style={str}>"npx"</span>,
      {'\n      '}<span style={key}>"args"</span>: [<span style={str}>"-y"</span>, <span style={str}>"@gpxco/mcp"</span>],
      {'\n      '}<span style={key}>"env"</span>: {'{'}
      {'\n        '}<span style={key}>"GPX_API_TOKEN"</span>: <span style={str}>"gpx_live_..."</span>
      {writes !== undefined ? (
        <span style={{ opacity: show }}>
          ,{'\n        '}
          <span style={{ ...key, background: 'rgba(242,90,84,0.25)', borderRadius: 6, padding: '2px 4px' }}>
            "GPX_MCP_ALLOW_WRITES": <span style={str}>"1"</span>
          </span>
        </span>
      ) : null}
      {'\n      }'}
      {'\n    }'}
      {'\n  }'}
      {'\n}'}
    </div>
  );
};

export const DesktopConfig: React.FC = () => (
  <AbsoluteFill style={{ background: color.light, justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ marginTop: -110, display: 'flex', gap: 56, alignItems: 'flex-start' }}>
      <div style={{ width: 520, fontFamily: sans, color: color.text, paddingTop: 70 }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: color.navy }}>Claude Desktop</div>
        <div style={{ fontSize: 30, marginTop: 12, color: color.muted, lineHeight: 1.4 }}>Settings › Developer › Edit Config, then restart</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: color.navy, marginTop: 56 }}>Cursor</div>
        <div style={{ fontSize: 30, marginTop: 12, color: color.muted, lineHeight: 1.4 }}>
          <span style={{ fontFamily: mono, fontSize: 27 }}>~/.cursor/mcp.json</span>
        </div>
      </div>
      <Window title="claude_desktop_config.json" dark width={1060}>
        <Json />
      </Window>
    </div>
    <Caption text="Same block for both. Your token goes in GPX_API_TOKEN." />
  </AbsoluteFill>
);

export const Writes: React.FC = () => (
  <AbsoluteFill style={{ background: color.light, justifyContent: 'center', alignItems: 'center' }}>
    <div style={{ marginTop: -110 }}>
      <div style={{ fontFamily: sans, fontSize: 40, fontWeight: 700, color: color.navy, marginBottom: 28 }}>Optional: let it make changes</div>
      <Window title="claude_desktop_config.json" dark width={1200}>
        <Json writes={20} />
      </Window>
    </div>
    <Caption text={'Read-only by default. To allow edits, add this line. Keep the quotes on "1".'} delay={30} />
  </AbsoluteFill>
);

export const TryIt: React.FC = () => {
  const frame = useCurrentFrame();
  const toApp = 150;
  const chatOpacity = interpolate(frame, [toApp - 10, toApp], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const appOpacity = interpolate(frame, [toApp - 10, toApp], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const linkGlow = interpolate(frame, [115, 125], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <>
      <AbsoluteFill style={{ opacity: chatOpacity }}>
        <Chat
          question="Where is Delivery Van 7?"
          tool="GPX · list_devices, get_device"
          answerAt={45}
          answer={
            <>
              <b>Delivery Van 7</b> is at 145 Avinguda de Peris i Valero, Valencia 46005. It last reported at 2:44 PM today, battery 82%.
              <br />
              <br />
              Open it in GPX:{' '}
              <span style={{ color: color.blue, textDecoration: 'underline', background: `rgba(37,99,235,${0.12 * linkGlow})`, borderRadius: 6, padding: '0 4px' }}>
                app.gpx.co/trackers/372864
              </span>
            </>
          }
        />
      </AbsoluteFill>
      {frame >= toApp - 10 ? (
        <AbsoluteFill style={{ opacity: appOpacity }}>
          <Shot src="shots/tracker.jpg" {...TRACKER_SHOT} url="app.gpx.co/trackers/372864" />
        </AbsoluteFill>
      ) : null}
      <Caption text="Ask by name. Answers link straight to the tracker in GPX." delay={75} />
    </>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: color.navy, justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ fontFamily: sans, textAlign: 'center', opacity: p }}>
        <Img src={staticFile('gpx-logo-white.svg')} style={{ width: 220 }} />
        <div style={{ fontFamily: mono, fontSize: 56, color: color.white, marginTop: 56 }}>npx -y @gpxco/mcp</div>
        <div style={{ fontSize: 34, color: '#b7c2c4', marginTop: 28 }}>Setup guide: npmjs.com/package/@gpxco/mcp</div>
      </div>
    </AbsoluteFill>
  );
};
