import React, { useEffect, useRef, useState } from 'react';
import { playTactileTick } from '../utils/audioAlarm';

export type ChronometerCueId = 'hero' | 'closeup' | 'apart' | 'around' | 'rebuild';

interface ChronographStage2DProps {
  activeCue: ChronometerCueId;
  scrollProgress: number;
  onSelectCue?: (id: ChronometerCueId) => void;
}

const CUE_CONFIG: Record<
  ChronometerCueId,
  {
    scale: number;
    offsetX: number;
    offsetY: number;
    explode: number;
    bezelRot: number;
    crownAngle: number;
    label: string;
  }
> = {
  hero: { scale: 1, offsetX: 15, offsetY: 0, explode: 0, bezelRot: 0, crownAngle: 18, label: '01 · Hero Calibre' },
  closeup: { scale: 1.24, offsetX: -12, offsetY: -4, explode: 0.14, bezelRot: 28, crownAngle: 72, label: '02 · Close-Up Dial' },
  apart: { scale: 1.06, offsetX: 8, offsetY: 0, explode: 1, bezelRot: 64, crownAngle: 148, label: '03 · Exploded Stack' },
  around: { scale: 1.12, offsetX: -14, offsetY: 2, explode: 0.35, bezelRot: 112, crownAngle: 235, label: '04 · Multi-Device Orbit' },
  rebuild: { scale: 1, offsetX: 12, offsetY: 0, explode: 0, bezelRot: 180, crownAngle: 330, label: '05 · Locked & Synced' },
};

const CALLOUT_LABELS = [
  { id: '01', left: '6%', top: '20%', title: 'BEZEL RING', detail: '12 Timed Checkpoints' },
  { id: '02', left: '8%', top: '72%', title: 'ESCAPEMENT', detail: '30s Server Heartbeat' },
  { id: '03', right: '6%', top: '22%', title: 'PAUSE BRIDGE', detail: 'Mandatory Break Gate' },
  { id: '04', right: '6%', top: '74%', title: 'KNURLED CROWN', detail: 'Desktop · Tablet · Mobile' },
];

export const ChronographStage2D: React.FC<ChronographStage2DProps> = ({
  activeCue,
  scrollProgress,
  onSelectCue,
}) => {
  const [blueprint, setBlueprint] = useState(false);
  const [holdingSlow, setHoldingSlow] = useState(false);
  const [tickAngle, setTickAngle] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(performance.now());
  const lastBeatRef = useRef<number>(-1);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;
      const rate = holdingSlow ? 1 / 12 : 1;
      setTickAngle((prev) => {
        const next = (prev + dt * 18 * rate) % 360;
        const beat = Math.floor(next / 30);
        if (holdingSlow && beat !== lastBeatRef.current) {
          lastBeatRef.current = beat;
          playTactileTick(820);
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [holdingSlow]);

  const cue = CUE_CONFIG[activeCue];
  const scrollTilt = (scrollProgress - 0.5) * 14;
  const explodeOffset = cue.explode * 26;

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden"
      onPointerMove={(e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        setPointer({ x: nx, y: ny });
      }}
    >
      {/* Radiant Atmospheric Double-Exposure Gradient Aura */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          transform: `translate3d(${pointer.x * -14}px, ${pointer.y * -10}px, 0)`,
          background:
            'radial-gradient(52% 48% at 62% 48%, rgba(225, 45, 28, 0.22) 0%, rgba(237, 227, 210, 0.06) 44%, rgba(10, 9, 8, 0) 76%)',
        }}
      />

      {/* Base Double-Exposure 2D Chronograph Artwork (feathered via radial mask—zero borders) */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out"
        style={{
          transform: `translate3d(${cue.offsetX + pointer.x * 1.6}%, ${cue.offsetY + pointer.y * 1.2}%, 0) scale(${cue.scale}) rotate(${scrollTilt * 0.25}deg)`,
        }}
      >
        <div className="relative h-[min(78vw,640px)] w-[min(92vw,860px)]">
          {/* Primary Double-Exposure Chronograph Artwork */}
          <img
            src="/src/assets/images/ember_chronograph_haze_1795423374897.jpg"
            alt="Precision matte titanium mechanical chronograph in warm ember double-exposure haze"
            referrerPolicy="no-referrer"
            className={`mask-fade-radial h-full w-full object-cover transition-opacity duration-500 ${
              blueprint ? 'opacity-15 grayscale' : 'opacity-70'
            }`}
          />

          {/* Secondary Macro Bezel & Knurled Crown Cutaway (Explodes on Beat 03) */}
          <img
            src="/assets/aistudio/image_e5f2758f.png"
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className={`mask-fade-radial pointer-events-none absolute inset-0 h-full w-full object-contain mix-blend-lighten transition-all duration-700 ${
              blueprint ? 'opacity-10' : 'opacity-50'
            }`}
            style={{
              transform: `translate3d(${explodeOffset * 0.8}px, ${-explodeOffset * 0.6}px, 0) scale(${0.92 + cue.explode * 0.08})`,
            }}
          />

          {/* Synchronized 2D Horology Vector Escapement & Blueprint Calibration Overlay */}
          <svg
            viewBox="0 0 600 600"
            className="pointer-events-none absolute inset-0 m-auto h-[84%] w-[84%] overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="emberGlow2D" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E12D1C" stopOpacity="0.28" />
                <stop offset="65%" stopColor="#EDE3D2" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#0A0908" stopOpacity="0" />
              </radialGradient>
            </defs>

            <circle cx="300" cy="300" r="245" fill="url(#emberGlow2D)" />

            {/* Outer Calibration Ring */}
            <g
              style={{
                transformOrigin: '300px 300px',
                transform: `rotate(${cue.bezelRot + scrollProgress * 45}deg)`,
                transition: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <circle
                cx="300"
                cy="300"
                r="232"
                fill="none"
                stroke={blueprint ? '#E12D1C' : '#EDE3D2'}
                strokeOpacity={blueprint ? 0.65 : 0.22}
                strokeWidth="1"
                strokeDasharray="3 9"
              />
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                const x1 = 300 + Math.cos(a) * 212;
                const y1 = 300 + Math.sin(a) * 212;
                const x2 = 300 + Math.cos(a) * 230;
                const y2 = 300 + Math.sin(a) * 230;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={i % 3 === 0 ? '#E12D1C' : '#EDE3D2'}
                    strokeOpacity={i % 3 === 0 ? 0.9 : 0.45}
                    strokeWidth={i % 3 === 0 ? 2.2 : 1.1}
                  />
                );
              })}
            </g>

            {/* Inner Escapement Track (Explodes outward vertically on Beat 03) */}
            <g
              style={{
                transformOrigin: '300px 300px',
                transform: `translate3d(${-explodeOffset * 0.5}px, ${explodeOffset * 0.7}px, 0) rotate(${-tickAngle * 0.6}deg)`,
                transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <circle
                cx="300"
                cy="300"
                r="164"
                fill="none"
                stroke={blueprint ? '#EDE3D2' : '#E12D1C'}
                strokeOpacity={blueprint ? 0.55 : 0.32}
                strokeWidth={blueprint ? 1.3 : 1}
              />
              <circle
                cx="300"
                cy="300"
                r="118"
                fill="none"
                stroke="#EDE3D2"
                strokeOpacity={blueprint ? 0.45 : 0.16}
                strokeWidth="1"
                strokeDasharray="6 6"
              />
            </g>

            {/* Live Sweeping Chronograph Hand */}
            <g
              style={{
                transformOrigin: '300px 300px',
                transform: `rotate(${tickAngle * 2}deg)`,
              }}
            >
              <line
                x1="300"
                y1="322"
                x2="300"
                y2="92"
                stroke="#E12D1C"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle cx="300" cy="300" r="6.5" fill="#EDE3D2" />
              <circle cx="300" cy="300" r="3" fill="#E12D1C" />
            </g>

            {/* Knurled Crown Sync Indicator */}
            <g
              style={{
                transformOrigin: '528px 300px',
                transform: `translate3d(${explodeOffset}px, 0, 0) rotate(${cue.crownAngle + tickAngle}deg)`,
                transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <circle
                cx="528"
                cy="300"
                r="38"
                fill="rgba(19, 17, 15, 0.85)"
                stroke={blueprint ? '#E12D1C' : '#EDE3D2'}
                strokeOpacity="0.35"
                strokeWidth="1.2"
              />
              <line x1="528" y1="266" x2="528" y2="282" stroke="#E12D1C" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          </svg>

          {/* Two-Column Exploded Callouts (appear smoothly when Explode > 0.4) */}
          <div
            className="pointer-events-none absolute inset-0 hidden md:block transition-opacity duration-500"
            style={{ opacity: cue.explode > 0.45 ? 1 : 0 }}
          >
            {CALLOUT_LABELS.map((item) => (
              <div
                key={item.id}
                className="absolute cadence-seam text-left"
                style={{ left: item.left, right: item.right, top: item.top }}
              >
                <div className="font-mono text-[10px] tracking-[0.18em] text-[#E12D1C]">
                  {item.id} · {item.title}
                </div>
                <div className="mt-0.5 text-xs font-medium text-[#EDE3D2]">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Precision Instrument Dock (Blueprint + Hold-for-Slow-Mo) */}
      <div className="pointer-events-auto absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-4 px-5 py-2.5 rounded-full bg-[#13110F]/85 shadow-[inset_0_1px_0_rgba(237,227,210,0.08)]">
        <span className="hidden sm:inline font-mono text-[10px] tracking-[0.16em] text-[#A69B8D] uppercase">
          {cue.label}
        </span>

        <button
          type="button"
          onClick={() => {
            playTactileTick(680);
            setBlueprint((v) => !v);
          }}
          className={`px-3 py-1 rounded-full font-mono text-[10px] tracking-[0.14em] uppercase transition-colors ${
            blueprint
              ? 'bg-[#E12D1C] text-[#EDE3D2]'
              : 'bg-[#1C1815] text-[#EDE3D2] hover:text-[#E12D1C]'
          }`}
        >
          {blueprint ? 'Studio Render' : 'Blueprint CAD'}
        </button>

        <button
          type="button"
          onPointerDown={() => setHoldingSlow(true)}
          onPointerUp={() => setHoldingSlow(false)}
          onPointerLeave={() => setHoldingSlow(false)}
          onClick={() => {
            if (onSelectCue) onSelectCue('closeup');
          }}
          className={`px-3 py-1 rounded-full font-mono text-[10px] tracking-[0.14em] uppercase transition-colors ${
            holdingSlow
              ? 'bg-[#EDE3D2] text-[#0A0908] font-semibold'
              : 'bg-[#1C1815] text-[#A69B8D] hover:text-[#EDE3D2]'
          }`}
        >
          {holdingSlow ? '1/12x Pulse Active' : 'Hold · Slow-Mo Pulse'}
        </button>
      </div>
    </div>
  );
};
