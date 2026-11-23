import React from 'react';
import type { DocChapter } from '../data/cadenceDocs';

interface FlowDiagramProps {
  type: NonNullable<DocChapter['diagramType']>;
}

export const FlowDiagram: React.FC<FlowDiagramProps> = ({ type }) => {
  if (type === 'auth-redirect') {
    return (
      <figure className="hairline-top hairline-bottom my-6 py-6">
        <figcaption className="mb-4 font-mono text-xs font-medium text-[#A69B8D]">
          Diagram · Route Guard &amp; Redirect Decision Pipeline
        </figcaption>
        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 820 210"
            className="h-auto w-full min-w-[640px]"
            role="img"
            aria-label="Authentication and page redirect flow diagram"
          >
            <defs>
              <marker id="arrow-ash" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#A69B8D" />
              </marker>
              <marker id="arrow-ember" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#E12D1C" />
              </marker>
            </defs>

            <rect x="16" y="34" width="144" height="58" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.22)" strokeWidth="1.2" />
            <text x="88" y="58" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">Incoming Route</text>
            <text x="88" y="75" textAnchor="middle" className="fill-[#A69B8D] text-[10px] font-mono">/dashboard, /session/...</text>

            <line x1="160" y1="63" x2="210" y2="63" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#arrow-ash)" />

            <rect x="212" y="34" width="154" height="58" rx="8" fill="#181210" stroke="#E12D1C" strokeWidth="1.4" />
            <text x="289" y="58" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">1. Auth Guard</text>
            <text x="289" y="75" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Valid JWT / Refresh?</text>

            <line x1="366" y1="63" x2="424" y2="63" stroke="#E12D1C" strokeWidth="1.4" markerEnd="url(#arrow-ember)" />
            <text x="395" y="54" textAnchor="middle" className="fill-[#E12D1C] text-[10px] font-medium">Pass</text>

            <rect x="426" y="34" width="164" height="58" rx="8" fill="#181210" stroke="#E12D1C" strokeWidth="1.4" />
            <text x="508" y="58" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">2. Onboarding Guard</text>
            <text x="508" y="75" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">onboardingCompleted?</text>

            <line x1="590" y1="63" x2="646" y2="63" stroke="#E12D1C" strokeWidth="1.4" markerEnd="url(#arrow-ember)" />
            <text x="618" y="54" textAnchor="middle" className="fill-[#E12D1C] text-[10px] font-medium">Yes</text>

            <rect x="648" y="34" width="156" height="58" rx="8" fill="#23120F" stroke="#E12D1C" strokeWidth="1.5" />
            <text x="726" y="58" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">3. Target View</text>
            <text x="726" y="75" textAnchor="middle" className="fill-[#E12D1C] text-[10px]">Matches Session State</text>

            <line x1="289" y1="92" x2="289" y2="132" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#arrow-ash)" />
            <text x="308" y="116" className="fill-[#E12D1C] text-[10px] font-medium">Fail</text>
            <rect x="200" y="136" width="178" height="54" rx="8" fill="#181210" stroke="rgba(237,227,210,0.35)" strokeWidth="1.2" />
            <text x="289" y="159" textAnchor="middle" className="fill-[#EDE3D2] text-[11px] font-semibold">Redirect /login</text>
            <text x="289" y="175" textAnchor="middle" className="fill-[#A69B8D] text-[10px] font-mono">?redirect=currentPath</text>

            <line x1="508" y1="92" x2="508" y2="132" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#arrow-ash)" />
            <text x="528" y="116" className="fill-[#E12D1C] text-[10px] font-medium">False</text>
            <rect x="424" y="136" width="168" height="54" rx="8" fill="#181210" stroke="rgba(237,227,210,0.35)" strokeWidth="1.2" />
            <text x="508" y="159" textAnchor="middle" className="fill-[#EDE3D2] text-[11px] font-semibold">Redirect /onboarding</text>
            <text x="508" y="175" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">4-step stack &amp; tool setup</text>

            <line x1="726" y1="92" x2="726" y2="132" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#arrow-ash)" />
            <text x="748" y="116" className="fill-[#A69B8D] text-[10px] font-medium">Sync</text>
            <rect x="646" y="136" width="158" height="54" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.22)" strokeWidth="1.2" />
            <text x="725" y="159" textAnchor="middle" className="fill-[#EDE3D2] text-[11px] font-semibold">State Auto-Redirect</text>
            <text x="725" y="175" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">paused → /pause · end → /summary</text>
          </svg>
        </div>
      </figure>
    );
  }

  if (type === 'session-state') {
    return (
      <figure className="hairline-top hairline-bottom my-6 py-6">
        <figcaption className="mb-4 font-mono text-xs font-medium text-[#A69B8D]">
          Diagram · Server-Authoritative Session State Machine
        </figcaption>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 820 215" className="h-auto w-full min-w-[640px]" role="img" aria-label="Session state machine diagram">
            <defs>
              <marker id="st-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#A69B8D" />
              </marker>
            </defs>

            <rect x="16" y="42" width="124" height="56" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.25)" strokeWidth="1.2" />
            <text x="78" y="66" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">planned</text>
            <text x="78" y="82" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Checkpoints allocated</text>

            <line x1="140" y1="70" x2="196" y2="70" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#st-arrow)" />
            <text x="168" y="61" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Start</text>

            <rect x="198" y="42" width="154" height="56" rx="8" fill="#23120F" stroke="#E12D1C" strokeWidth="1.5" />
            <text x="275" y="66" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">active</text>
            <text x="275" y="82" textAnchor="middle" className="fill-[#E12D1C] text-[10px]">30s Heartbeat · Live Timer</text>

            <line x1="352" y1="58" x2="424" y2="58" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#st-arrow)" />
            <text x="388" y="50" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Pause (Reason)</text>
            <line x1="424" y1="82" x2="352" y2="82" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#st-arrow)" />
            <text x="388" y="96" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Resume</text>

            <rect x="426" y="42" width="154" height="56" rx="8" fill="#181210" stroke="#EDE3D2" strokeWidth="1.4" />
            <text x="503" y="66" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">paused</text>
            <text x="503" y="82" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Countdown + Audio Alarm</text>

            <line x1="580" y1="60" x2="646" y2="45" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#st-arrow)" />
            <text x="615" y="42" textAnchor="middle" className="fill-[#EDE3D2] text-[10px] font-medium">End + Log</text>
            <rect x="648" y="20" width="156" height="54" rx="8" fill="#181210" stroke="#EDE3D2" strokeWidth="1.4" />
            <text x="726" y="43" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">completed</text>
            <text x="726" y="59" textAnchor="middle" className="fill-[#E12D1C] text-[10px]">XP + Accuracy + Portfolio</text>

            <line x1="580" y1="84" x2="646" y2="122" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#st-arrow)" />
            <text x="618" y="114" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Abandon</text>
            <rect x="648" y="102" width="156" height="50" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.22)" strokeWidth="1.2" />
            <text x="726" y="124" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">abandoned</text>
            <text x="726" y="139" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">0 XP · Audit preserved</text>

            <line x1="275" y1="98" x2="275" y2="140" stroke="#A69B8D" strokeWidth="1.4" markerEnd="url(#st-arrow)" />
            <text x="342" y="124" className="fill-[#E12D1C] text-[10px]">No heartbeat &gt; 3m (Cron)</text>
            <rect x="176" y="144" width="198" height="54" rx="8" fill="#23120F" stroke="#E12D1C" strokeWidth="1.2" />
            <text x="275" y="167" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">lapsed (App Closed)</text>
            <text x="275" y="183" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">endedAt = lastHeartbeat · IDE kept</text>
          </svg>
        </div>
      </figure>
    );
  }

  if (type === 'device-handoff') {
    return (
      <figure className="hairline-top hairline-bottom my-6 py-6">
        <figcaption className="mb-4 font-mono text-xs font-medium text-[#A69B8D]">
          Diagram · Desktop, Tablet &amp; Mobile Live Session Sync
        </figcaption>
        <div className="overflow-x-auto">
          <svg viewBox="0 0 820 155" className="h-auto w-full min-w-[640px]" role="img" aria-label="Device sync diagram">
            <defs>
              <marker id="dh-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#E12D1C" />
              </marker>
            </defs>
            <rect x="20" y="34" width="210" height="84" rx="8" fill="#23120F" stroke="#E12D1C" strokeWidth="1.4" />
            <text x="125" y="60" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">Desktop &amp; Tablet Web</text>
            <text x="125" y="78" textAnchor="middle" className="fill-[#E12D1C] text-[10px]">Starts session · X-Cadence-Device: web</text>
            <text x="125" y="96" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Sidebar / Icon Rail + IDE Links</text>

            <line x1="230" y1="76" x2="294" y2="76" stroke="#E12D1C" strokeWidth="1.4" markerEnd="url(#dh-arrow)" />

            <rect x="296" y="24" width="228" height="104" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.28)" strokeWidth="1.4" />
            <text x="410" y="50" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">Express API + Database</text>
            <text x="410" y="69" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Detects responsive device change</text>
            <text x="410" y="86" textAnchor="middle" className="fill-[#EDE3D2] text-[10px] font-mono">deviceEvents.push(web → mobile)</text>
            <text x="410" y="106" textAnchor="middle" className="fill-[#E12D1C] text-[10px]">Triggers Web Audio &amp; Alert Watchdog</text>

            <line x1="524" y1="76" x2="588" y2="76" stroke="#E12D1C" strokeWidth="1.4" markerEnd="url(#dh-arrow)" />

            <rect x="590" y="34" width="210" height="84" rx="8" fill="#23120F" stroke="#E12D1C" strokeWidth="1.4" />
            <text x="695" y="60" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">Mobile Web Layout (&lt;768px)</text>
            <text x="695" y="78" textAnchor="middle" className="fill-[#E12D1C] text-[10px]">GET /api/sessions/active picks up live</text>
            <text x="695" y="96" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Thumb Nav + Pause / End Controls</text>
          </svg>
        </div>
      </figure>
    );
  }

  return (
    <figure className="hairline-top hairline-bottom my-6 py-6">
      <figcaption className="mb-4 font-mono text-xs font-medium text-[#A69B8D]">
        Diagram · 3-Layer Activity Ingestion (Metadata-Only Privacy Model)
      </figcaption>
      <div className="overflow-x-auto">
        <svg viewBox="0 0 820 190" className="h-auto w-full min-w-[640px]" role="img" aria-label="Three-layer tracking architecture diagram">
          <defs>
            <marker id="tl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#A69B8D" />
            </marker>
          </defs>

          <rect x="18" y="18" width="230" height="44" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.24)" strokeWidth="1.2" />
          <text x="133" y="38" textAnchor="middle" className="fill-[#EDE3D2] text-[11px] font-semibold">Layer 1: Unified VS Code Ext</text>
          <text x="133" y="53" textAnchor="middle" className="fill-[#A69B8D] text-[9.5px]">VS Code · Cursor · Windsurf · Antigravity</text>

          <rect x="18" y="74" width="230" height="44" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.24)" strokeWidth="1.2" />
          <text x="133" y="94" textAnchor="middle" className="fill-[#EDE3D2] text-[11px] font-semibold">Layer 2: Chrome MV3 Ext</text>
          <text x="133" y="109" textAnchor="middle" className="fill-[#A69B8D] text-[9.5px]">AI Studio · Stitch · Claude · Lovable · Manus</text>

          <rect x="18" y="130" width="230" height="44" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.24)" strokeWidth="1.2" />
          <text x="133" y="150" textAnchor="middle" className="fill-[#EDE3D2] text-[11px] font-semibold">Layer 3: Web / Mobile App</text>
          <text x="133" y="165" textAnchor="middle" className="fill-[#A69B8D] text-[9.5px]">Manual switch + URI deep links</text>

          <line x1="248" y1="40" x2="324" y2="85" stroke="#A69B8D" strokeWidth="1.3" markerEnd="url(#tl-arrow)" />
          <line x1="248" y1="96" x2="324" y2="96" stroke="#A69B8D" strokeWidth="1.3" markerEnd="url(#tl-arrow)" />
          <line x1="248" y1="152" x2="324" y2="107" stroke="#A69B8D" strokeWidth="1.3" markerEnd="url(#tl-arrow)" />

          <rect x="328" y="52" width="218" height="86" rx="8" fill="#23120F" stroke="#E12D1C" strokeWidth="1.4" />
          <text x="437" y="76" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold font-mono">POST /api/activity</text>
          <text x="437" y="95" textAnchor="middle" className="fill-[#E12D1C] text-[10px]">60s ping · 120s active idle filter</text>
          <text x="437" y="112" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Scoped ext_ token · Zero source code</text>
          <text x="437" y="128" textAnchor="middle" className="fill-[#EDE3D2] text-[10px]">Appends activitySlices[]</text>

          <line x1="546" y1="96" x2="604" y2="96" stroke="#A69B8D" strokeWidth="1.3" markerEnd="url(#tl-arrow)" />

          <rect x="606" y="52" width="194" height="86" rx="8" fill="#0A0908" stroke="rgba(237,227,210,0.28)" strokeWidth="1.3" />
          <text x="703" y="78" textAnchor="middle" className="fill-[#EDE3D2] text-[12px] font-semibold">Live Checkpoint Rollup</text>
          <text x="703" y="97" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Per-tool minutes</text>
          <text x="703" y="113" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Language &amp; commit audit</text>
          <text x="703" y="129" textAnchor="middle" className="fill-[#A69B8D] text-[10px]">Planned vs actual delta</text>
        </svg>
      </div>
    </figure>
  );
};
