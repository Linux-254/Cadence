import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { DocChapter } from '../data/cadenceDocs';
import { FlowDiagram } from './FlowDiagram';
import { RouteExplorer } from './RouteExplorer';

interface ChapterViewProps {
  chapter: DocChapter;
}

const CodeBlockCard: React.FC<{ title: string; language: string; code: string }> = ({ title, language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-6 editorial-band hairline-top hairline-bottom">
      <div className="flex items-center justify-between gap-4 px-2 py-2.5 hairline-bottom">
        <div className="flex min-w-0 items-center gap-2 text-xs text-[#A69B8D]">
          <span className="truncate font-mono font-medium text-[#EDE3D2]">{title}</span>
          <span aria-hidden="true" className="text-[#6E655B]">·</span>
          <span className="shrink-0 font-mono text-[#E12D1C]">{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="cadence-keycap inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[#EDE3D2] whitespace-nowrap"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#E12D1C]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#0A0908]/75 p-4 text-[12.5px] leading-relaxed text-[#EDE3D2]">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export const ChapterView: React.FC<ChapterViewProps> = ({ chapter }) => {
  return (
    <article
      id={`chapter-${chapter.id}`}
      className="scroll-mt-24 pb-12 hairline-bottom last:shadow-none"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#A69B8D] tabular-nums">
        <span className="font-mono text-[#E12D1C]">Chapter {chapter.number}</span>
        <span aria-hidden="true">·</span>
        <span>{chapter.category}</span>
      </div>

      <h2 className="font-display text-2xl font-bold tracking-tight text-[#EDE3D2] sm:text-3xl [text-wrap:balance]">
        {chapter.title}
      </h2>
      <p className="mt-2.5 max-w-3xl text-[15px] leading-relaxed text-[#A69B8D]">
        {chapter.summary}
      </p>

      {chapter.diagramType && <FlowDiagram type={chapter.diagramType} />}
      {chapter.id === 'pages-routes-redirects' && <RouteExplorer />}

      <div className="mt-8 space-y-9">
        {chapter.subsections.map((sub) => (
          <section key={sub.id} id={sub.id} className="scroll-mt-24">
            <h3 className="font-display text-lg font-semibold text-[#EDE3D2]">
              {sub.title}
            </h3>

            {sub.paragraphs?.map((para, idx) => (
              <p key={idx} className="mt-2.5 max-w-3xl text-[15px] leading-7 text-[#A69B8D]">
                {para}
              </p>
            ))}

            {sub.bullets && (
              <ul className="mt-3 max-w-3xl space-y-2 text-[14.5px] leading-6 text-[#A69B8D]">
                {sub.bullets.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E12D1C]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {sub.orderedList && (
              <ol className="mt-3 max-w-3xl space-y-2.5 text-[14.5px] leading-6 text-[#A69B8D]">
                {sub.orderedList.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-xs font-semibold text-[#E12D1C] tabular-nums">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            )}

            {sub.callout && (
              <div className="cadence-seam editorial-band-ember my-5 py-3 pr-4">
                <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#E12D1C]">
                  {sub.callout.label}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#EDE3D2]">{sub.callout.body}</p>
              </div>
            )}

            {sub.tables?.map((tbl, tIdx) => (
              <div key={tIdx} className="my-6">
                {tbl.title && (
                  <div className="mb-2 text-xs font-semibold text-[#EDE3D2]">{tbl.title}</div>
                )}
                <div className="overflow-x-auto hairline-top hairline-bottom">
                  <table className="w-full border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="hairline-bottom">
                        {tbl.headers.map((hdr, hIdx) => (
                          <th key={hIdx} className="px-4 py-3 font-semibold text-[#EDE3D2] whitespace-nowrap">
                            {hdr}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE3D2]/[0.06]">
                      {tbl.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="transition-colors hover:bg-[#1C1815]/35">
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`px-4 py-3 align-top leading-relaxed ${
                                cIdx === 0
                                  ? 'font-mono text-xs font-medium text-[#E12D1C]'
                                  : 'text-[#A69B8D]'
                              }`}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {sub.codeBlocks?.map((cb, cIdx) => (
              <CodeBlockCard key={cIdx} title={cb.title} language={cb.language} code={cb.code} />
            ))}
          </section>
        ))}
      </div>
    </article>
  );
};
