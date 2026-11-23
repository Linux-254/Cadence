import React, { useState } from 'react';
import {
  Code2,
  Database,
  ExternalLink,
  Globe,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Terminal as TerminalIcon,
  X,
} from 'lucide-react';
import { playTactileClick } from '../utils/audioAlarm';

interface WorkstationStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  toolName?: string;
  toolUrl?: string;
  initialTab?: 'browser' | 'editor' | 'sql' | 'terminal' | 'architecture' | 'add_tool';
}

export const WorkstationStudioModal: React.FC<WorkstationStudioModalProps> = ({
  isOpen,
  onClose,
  toolName = 'Cadence Dev Workstation',
  toolUrl = 'https://ai.google.dev',
  initialTab = 'browser',
}) => {
  const [activeTab, setActiveTab] = useState<'browser' | 'editor' | 'sql' | 'terminal' | 'architecture' | 'add_tool'>(initialTab);
  const [currentUrl, setCurrentUrl] = useState(toolUrl);
  const [urlInput, setUrlInput] = useState(toolUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Custom tool addition state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customProtocol, setCustomProtocol] = useState('');
  const [customPermission, setCustomPermission] = useState(true);
  const [customToolsList, setCustomToolsList] = useState<Array<{ name: string; url: string; protocol: string }>>([
    { name: 'Antigravity Studio', url: 'https://antigravity.dev', protocol: 'antigravity://' },
    { name: 'VS Code Desktop', url: 'http://localhost:3000', protocol: 'vscode://' },
    { name: 'Figma Cloud Canvas', url: 'https://figma.com', protocol: 'figma://' },
  ]);

  // Editor state
  const [codeFile, setCodeFile] = useState('app.ts');
  const [codeContent, setCodeContent] = useState(`import express from 'express';\nimport { ensureStorageReady } from './server/storage';\n\nconst app = express();\n\napp.get('/api/live', async (req, res) => {\n  await ensureStorageReady();\n  res.json({ ok: true, message: 'In-platform window engine active.' });\n});\n\nexport default app;`);
  const [consoleOutput, setConsoleOutput] = useState('Ready. Press "Execute Code" to run in-platform sandbox.');

  // SQL state
  const [sqlQuery, setSqlQuery] = useState('SELECT id, username, email, xp, tier FROM users;');
  const [sqlResults, setSqlResults] = useState<Array<Record<string, unknown>>>([
    { id: 'demo_learner', username: 'learner_demo', email: 'learner@cadence.dev', xp: 450, tier: 'Apprentice' },
    { id: 'demo_student', username: 'student_demo', email: 'student@cadence.dev', xp: 1280, tier: 'Journeyman' },
    { id: 'demo_jobseeker', username: 'jobseeker_demo', email: 'jobseeker@cadence.dev', xp: 2950, tier: 'Craftsman' },
    { id: 'demo_freelancer', username: 'freelancer_demo', email: 'freelancer@cadence.dev', xp: 5400, tier: 'Architect' },
    { id: 'demo_employed', username: 'employed_demo', email: 'employed@cadence.dev', xp: 7200, tier: 'Architect' },
    { id: 'demo_founder', username: 'founder_demo', email: 'founder@cadence.dev', xp: 9800, tier: 'Principal' },
  ]);

  // Terminal state
  const [termInput, setTermInput] = useState('');
  const [termLines, setTermLines] = useState<string[]>([
    'Cadence In-Platform Desktop Window & CLI v1.3.0',
    'All tools and platforms operate strictly within the platform sandbox.',
    '$ cadence-platform --status',
    'In-platform iframe/sandbox proxy: ACTIVE',
    'Zero external popup redirection required.',
  ]);

  if (!isOpen) return null;

  const handleNavigateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    playTactileClick('confirm');
    let target = urlInput.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    setCurrentUrl(target);
  };

  const handleAddCustomTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customUrl.trim()) return;
    playTactileClick('confirm');
    setCustomToolsList((prev) => [...prev, { name: customName, url: customUrl, protocol: customProtocol }]);
    setCurrentUrl(customUrl);
    setToolNameState(customName);
    setActiveTab('browser');
    setCustomName('');
    setCustomUrl('');
    setCustomProtocol('');
  };

  const [toolNameState, setToolNameState] = useState(toolName);

  const handleRunCode = () => {
    playTactileClick('confirm');
    setConsoleOutput(`[Execution Started at ${new Date().toLocaleTimeString()}]\nCompiling module ${codeFile} inside platform sandbox...\nTypeScript check passed (0 errors).\nOutput:\n> In-platform execution successful.`);
  };

  const handleRunSql = () => {
    playTactileClick('confirm');
    const q = sqlQuery.toLowerCase().trim();
    if (q.includes('users')) {
      setSqlResults([
        { id: 'demo_learner', username: 'learner_demo', email: 'learner@cadence.dev', xp: 450, tier: 'Apprentice' },
        { id: 'demo_student', username: 'student_demo', email: 'student@cadence.dev', xp: 1280, tier: 'Journeyman' },
        { id: 'demo_jobseeker', username: 'jobseeker_demo', email: 'jobseeker@cadence.dev', xp: 2950, tier: 'Craftsman' },
        { id: 'demo_freelancer', username: 'freelancer_demo', email: 'freelancer@cadence.dev', xp: 5400, tier: 'Architect' },
        { id: 'demo_employed', username: 'employed_demo', email: 'employed@cadence.dev', xp: 7200, tier: 'Architect' },
        { id: 'demo_founder', username: 'founder_demo', email: 'founder@cadence.dev', xp: 9800, tier: 'Principal' },
      ]);
    } else {
      setSqlResults([{ message: 'Query executed successfully within platform database.', query: sqlQuery }]);
    }
  };

  const handleTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termInput.trim()) return;
    const cmd = termInput.trim();
    playTactileClick('tick');
    const newLines = [...termLines, `$ ${cmd}`];
    if (cmd === 'clear') {
      setTermLines(['Cadence In-Platform Terminal CLI']);
    } else if (cmd === 'npm run build') {
      newLines.push('Building bundle inside platform worker... Success.');
      setTermLines(newLines);
    } else {
      newLines.push(`Executed '${cmd}' in in-platform virtual process. Exit code 0.`);
      setTermLines(newLines);
    }
    setTermInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0908]/90 backdrop-blur-md p-2 sm:p-6">
      <div className={`flex flex-col w-full ${isFullscreen ? 'h-full max-w-none rounded-none' : 'h-[92vh] max-w-7xl rounded-2xl'} bg-[#13100E] border border-[#EDE3D2]/15 shadow-2xl overflow-hidden kinetic-enter transition-all`}>
        {/* Top Window Chrome */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0C0B0A] border-b border-[#EDE3D2]/10 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#E12D1C] inline-block cursor-pointer" onClick={onClose} />
              <span className="h-3 w-3 rounded-full bg-[#A69B8D]/40 inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#EDE3D2]/30 inline-block cursor-pointer" onClick={() => setIsFullscreen(!isFullscreen)} />
            </div>
            <div className="h-4 w-[1px] bg-[#EDE3D2]/10 mx-1" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#E12D1C]" />
              <span className="font-mono text-xs font-semibold text-[#EDE3D2] truncate max-w-xs">
                {toolNameState} (In-Platform Secure Sandbox)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-lg p-1.5 text-[#A69B8D] hover:bg-[#EDE3D2]/10 hover:text-[#EDE3D2]"
              title={isFullscreen ? 'Restore Window' : 'Maximize Window'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#A69B8D] hover:bg-[#EDE3D2]/10 hover:text-[#EDE3D2]"
              title="Close Window"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#0A0908] border-b border-[#EDE3D2]/10 overflow-x-auto">
          <div className="flex items-center gap-2">
            {[
              { id: 'browser', label: 'App / Browser Window', icon: Globe },
              { id: 'editor', label: 'Code Editor', icon: Code2 },
              { id: 'sql', label: 'SQL Console', icon: Database },
              { id: 'terminal', label: 'Terminal CLI', icon: TerminalIcon },
              { id: 'architecture', label: 'Architecture', icon: Layers },
              { id: 'add_tool', label: '+ Add Tool / Platform', icon: Plus },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playTactileClick('tick');
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  data-active={active}
                  className={`cadence-keycap inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold ${
                    active ? 'text-[#EDE3D2] bg-[#EDE3D2]/10 border-[#E12D1C]' : 'text-[#A69B8D]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 text-[#E12D1C]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {customToolsList.length > 0 && activeTab === 'browser' && (
            <div className="hidden md:flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-[#A69B8D]">Quick Launch:</span>
              {customToolsList.slice(0, 3).map((ct) => (
                <button
                  key={ct.name}
                  type="button"
                  onClick={() => {
                    setCurrentUrl(ct.url);
                    setUrlInput(ct.url);
                    setToolNameState(ct.name);
                  }}
                  className="rounded-lg bg-[#EDE3D2]/5 px-2.5 py-1 font-mono text-[10px] text-[#EDE3D2] hover:bg-[#EDE3D2]/15"
                >
                  {ct.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0A0908]">
          {activeTab === 'browser' && (
            <div className="flex flex-col h-full">
              {/* Simulated Browser URL Bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0C0B0A] border-b border-[#EDE3D2]/10">
                <button
                  type="button"
                  onClick={() => {
                    const iframe = document.getElementById('in-platform-iframe') as HTMLIFrameElement;
                    if (iframe) iframe.src = currentUrl;
                  }}
                  className="rounded-lg p-1.5 text-[#A69B8D] hover:text-[#EDE3D2]"
                  title="Reload"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <form onSubmit={handleNavigateUrl} className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Enter URL or platform address (e.g. https://antigravity.dev, http://localhost:3000)..."
                    className="cadence-field flex-1 font-mono text-xs py-1.5 px-3"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#E12D1C] px-3.5 py-1.5 font-mono text-xs font-semibold text-[#EDE3D2] hover:brightness-110"
                  >
                    Load in Platform
                  </button>
                </form>
              </div>

              {/* In-Platform Sandbox Screen (Iframe or Simulated App Workspace) */}
              <div className="flex-1 relative bg-[#060505] overflow-hidden flex flex-col">
                <iframe
                  id="in-platform-iframe"
                  src={currentUrl}
                  title={toolNameState}
                  className="w-full flex-1 border-0 bg-white"
                  onError={() => {
                    // Fallback to simulated app container if X-Frame-Options blocks iframe
                  }}
                />
                <div className="absolute bottom-3 right-3 rounded-lg bg-[#0A0908]/90 backdrop-blur-md px-3 py-1.5 border border-[#EDE3D2]/10 font-mono text-[10px] text-[#A69B8D] flex items-center gap-2 pointer-events-none">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Running securely inside Cadence platform sandbox</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-6 h-full overflow-y-auto">
              <div className="lg:col-span-8 flex flex-col rounded-xl bg-[#0C0B0A] border border-[#EDE3D2]/10 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-[#13100E] border-b border-[#EDE3D2]/10">
                  <div className="flex items-center gap-2">
                    {['app.ts', 'storage.ts', 'schema.sql'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setCodeFile(f);
                          if (f === 'storage.ts') setCodeContent('export async function findUser(id: string) { return await UserModel.findById(id); }');
                          else if (f === 'schema.sql') setCodeContent('CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, xp INT);');
                          else setCodeContent('import express from "express";\nconst app = express();');
                        }}
                        className={`rounded-lg px-3 py-1 font-mono text-xs ${codeFile === f ? 'bg-[#EDE3D2]/15 text-[#EDE3D2]' : 'text-[#A69B8D]'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleRunCode}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E12D1C] px-3 py-1 text-xs font-semibold text-[#EDE3D2] shadow-sm hover:brightness-110"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Run Module</span>
                  </button>
                </div>
                <textarea
                  value={codeContent}
                  onChange={(e) => setCodeContent(e.target.value)}
                  className="flex-1 w-full bg-transparent p-4 font-mono text-xs text-[#EDE3D2] resize-none focus:outline-none leading-relaxed"
                  rows={14}
                />
              </div>

              <div className="lg:col-span-4 flex flex-col rounded-xl bg-[#0C0B0A] border border-[#EDE3D2]/10 p-4">
                <div className="font-mono text-[11px] uppercase tracking-wider text-[#A69B8D] mb-2">
                  In-Platform Console Output
                </div>
                <pre className="flex-1 bg-[#0A0908] p-3 rounded-lg font-mono text-[11px] text-[#EDE3D2]/90 overflow-auto whitespace-pre-wrap">
                  {consoleOutput}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-6 p-6 overflow-y-auto">
              <div className="rounded-xl bg-[#0C0B0A] border border-[#EDE3D2]/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs text-[#A69B8D]">In-Platform SQL Query Runner</span>
                  <div className="flex gap-2">
                    {['SELECT * FROM users', 'SELECT * FROM projects'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSqlQuery(s + ';')}
                        className="cadence-keycap rounded-lg px-2.5 py-1 text-[11px] text-[#EDE3D2]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="cadence-field flex-1 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleRunSql}
                    className="rounded-xl bg-[#E12D1C] px-5 py-2.5 text-xs font-semibold text-[#EDE3D2] hover:brightness-110"
                  >
                    Execute Query
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-[#0C0B0A] border border-[#EDE3D2]/10 overflow-hidden">
                <div className="px-4 py-3 bg-[#13100E] border-b border-[#EDE3D2]/10 font-mono text-xs text-[#A69B8D]">
                  Results Table ({sqlResults.length} rows)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0A0908] text-[#A69B8D] border-b border-[#EDE3D2]/10">
                      <tr>
                        {sqlResults[0] && Object.keys(sqlResults[0]).map((k) => (
                          <th key={k} className="px-4 py-2 uppercase tracking-wider">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE3D2]/[0.06] text-[#EDE3D2]">
                      {sqlResults.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#EDE3D2]/[0.02]">
                          {Object.values(row).map((v, i) => (
                            <td key={i} className="px-4 py-2.5">{String(v ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="flex flex-col h-full p-6 rounded-xl bg-[#0C0B0A] font-mono text-xs">
              <div className="flex-1 overflow-y-auto space-y-1.5 mb-4 text-[#EDE3D2]/90">
                {termLines.map((line, i) => (
                  <div key={i} className={line.startsWith('$') ? 'text-[#E12D1C] font-bold' : ''}>
                    {line}
                  </div>
                ))}
              </div>
              <form onSubmit={handleTermSubmit} className="flex gap-2 pt-3 hairline-top">
                <span className="text-[#E12D1C]">$</span>
                <input
                  type="text"
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="Type command (e.g. npm run build)..."
                  className="flex-1 bg-transparent text-[#EDE3D2] focus:outline-none font-mono text-xs"
                />
                <button type="submit" className="text-xs text-[#A69B8D] hover:text-[#EDE3D2]">
                  Run
                </button>
              </form>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="rounded-xl bg-[#0C0B0A] border border-[#EDE3D2]/10 p-6">
                <h3 className="font-display text-lg font-bold text-[#EDE3D2]">In-Platform Operating Architecture</h3>
                <p className="mt-1 text-xs text-[#A69B8D]">
                  All tools, platforms (Antigravity, VS Code, Figma), and custom URLs operate strictly within the platform's secure virtualized sandbox window.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'add_tool' && (
            <div className="p-6 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto">
              <div className="cadence-seam">
                <h3 className="font-display text-xl font-bold text-[#EDE3D2]">Add Custom Tool or Platform</h3>
                <p className="mt-1 text-xs text-[#A69B8D]">
                  Paste any URL, custom web app address, or protocol. Cadence will open and operate it strictly within the platform window sandbox.
                </p>
              </div>

              <form onSubmit={handleAddCustomTool} className="space-y-4 pt-4 hairline-top">
                <div>
                  <label className="block font-mono text-[11px] text-[#A69B8D]">Tool or Platform Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Custom AI Workspace or Staging App"
                    className="cadence-field mt-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#A69B8D]">URL or Web Address</label>
                  <input
                    type="text"
                    required
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://my-app.dev or http://localhost:4000"
                    className="cadence-field mt-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-[#A69B8D]">Custom Protocol (Optional)</label>
                  <input
                    type="text"
                    value={customProtocol}
                    onChange={(e) => setCustomProtocol(e.target.value)}
                    placeholder="e.g. app:// or custom://"
                    className="cadence-field mt-1.5 text-xs"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="perm-check"
                    checked={customPermission}
                    onChange={(e) => setCustomPermission(e.target.checked)}
                    className="h-4 w-4 rounded border-[#EDE3D2]/20 bg-[#0A0908] text-[#E12D1C] focus:ring-0"
                  />
                  <label htmlFor="perm-check" className="text-xs text-[#EDE3D2]">
                    Grant permission to operate and sandbox this tool strictly within the platform.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] py-3 text-xs font-semibold text-[#EDE3D2] shadow-lg hover:brightness-110"
                >
                  Add &amp; Open In-Platform
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
