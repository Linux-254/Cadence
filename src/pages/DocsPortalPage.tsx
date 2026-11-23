import React, { useMemo, useState } from 'react';
import { ArrowLeft, Download, Menu, Printer, Search, X } from 'lucide-react';
import { CADENCE_CHAPTERS, DOC_METADATA, type DocChapter } from '../data/cadenceDocs';
import { ChapterView } from '../components/ChapterView';
import { useAuth } from '../context/AuthContext';
import { playTactileClick } from '../utils/audioAlarm';
import { downloadSpecPdf } from '../utils/pdfDownload';

type CategoryFilter = 'All' | DocChapter['category'];

const CATEGORIES: CategoryFilter[] = [
  'All',
  'Product',
  'Routing & Auth',
  'Backend & Data',
  'Extensions & Devices',
  'Codebase & UI/UX',
  'Deployment & Pitch',
];

export const DocsPortalPage: React.FC = () => {
  const { user, navigate } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [activeChapterId, setActiveChapterId] = useState<string>(CADENCE_CHAPTERS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CADENCE_CHAPTERS.filter((ch) => {
      const matchesCategory = categoryFilter === 'All' || ch.category === categoryFilter;
      if (!matchesCategory) return false;
      if (!q) return true;
      const inTitle = ch.title.toLowerCase().includes(q) || ch.summary.toLowerCase().includes(q);
      const inSubs = ch.subsections.some((sub) => {
        if (sub.title.toLowerCase().includes(q)) return true;
        if (sub.paragraphs?.some((p) => p.toLowerCase().includes(q))) return true;
        if (sub.bullets?.some((b) => b.toLowerCase().includes(q))) return true;
        if (sub.orderedList?.some((o) => o.toLowerCase().includes(q))) return true;
        if (sub.tables?.some((t) => t.rows.some((r) => r.some((c) => c.toLowerCase().includes(q))))) return true;
        if (sub.codeBlocks?.some((cb) => cb.title.toLowerCase().includes(q) || cb.code.toLowerCase().includes(q))) return true;
        return false;
      });
      return inTitle || inSubs;
    });
  }, [searchQuery, categoryFilter]);

  const jumpToChapter = (chapterId: string, resetFilters = false) => {
    playTactileClick('tick');
    if (resetFilters) {
      setCategoryFilter('All');
      setSearchQuery('');
    }
    setActiveChapterId(chapterId);
    setMobileNavOpen(false);
    setTimeout(() => {
      const el = document.getElementById(`chapter-${chapterId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  };

  const handleDownloadPdf = async () => {
    setPdfError('');
    setDownloadingPdf(true);
    try {
      await downloadSpecPdf((msg) => setPdfError(msg));
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0908] text-[#EDE3D2] studio-radial-bg">
      <header className="sticky top-0 z-30 bg-[#0A0908]/95 hairline-bottom">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="cadence-keycap inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#A69B8D] hover:text-[#EDE3D2] lg:hidden"
            >
              {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => navigate(user ? '/dashboard' : '/')}
              className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#EDE3D2] hover:text-[#E12D1C] whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-[#E12D1C]" aria-hidden="true" />
              <span>{user ? 'Back to App' : 'Cadence Home'}</span>
            </button>
          </div>

          <nav aria-label="Primary sections" className="hidden md:flex items-center gap-6 text-xs font-medium text-[#A69B8D]">
            <button type="button" onClick={() => jumpToChapter('executive-prd', true)} className="nav-link-underline hover:text-[#EDE3D2] whitespace-nowrap shrink-0">
              Overview
            </button>
            <button type="button" onClick={() => jumpToChapter('codebase-file-structure', true)} className="nav-link-underline hover:text-[#EDE3D2] whitespace-nowrap shrink-0">
              Codebase Map
            </button>
            <button type="button" onClick={() => jumpToChapter('uiux-3d-rationale', true)} className="nav-link-underline hover:text-[#EDE3D2] whitespace-nowrap shrink-0">
              UI/UX &amp; 2D Chronograph
            </button>
            <button type="button" onClick={() => jumpToChapter('instructor-viva-qa', true)} className="nav-link-underline hover:text-[#EDE3D2] whitespace-nowrap shrink-0">
              Instructor Q&amp;A
            </button>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {pdfError && <span className="hidden sm:inline text-xs text-[#E12D1C]">{pdfError}</span>}
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={() => void handleDownloadPdf()}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#E12D1C] to-[#C62314] px-4 py-2 text-xs font-semibold text-[#EDE3D2] shadow-[0_12px_28px_-10px_rgba(225,45,28,0.6)] hover:brightness-110 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{downloadingPdf ? 'Downloading PDF...' : 'Download All-in-One PDF'}</span>
            </button>
          </div>
        </div>
      </header>

      <div id="top" className="mx-auto flex max-w-[1440px]">
        {mobileNavOpen && (
          <div className="fixed inset-0 z-20 bg-black/70 lg:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-20 mt-[61px] w-[280px] shrink-0 overflow-y-auto bg-[#0D0B0A] p-5 shadow-[1px_0_0_rgba(237,227,210,0.06)] transition-transform duration-200 lg:sticky lg:top-[61px] lg:mt-0 lg:h-[calc(100vh-61px)] lg:translate-x-0 ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 bottom-3 h-4 w-4 text-[#A69B8D]" aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search docs & viva Q&A..."
                className="cadence-field pl-9 text-xs"
              />
            </div>

            <div>
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[#A69B8D]">
                Filter by Domain
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    data-active={categoryFilter === cat ? 'true' : 'false'}
                    onClick={() => {
                      playTactileClick('tick');
                      setCategoryFilter(cat);
                    }}
                    className="cadence-keycap rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[#EDE3D2]"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <nav aria-label="Documentation chapters">
              <ul className="space-y-1">
                {filteredChapters.map((ch) => (
                  <li key={ch.id}>
                    <button
                      type="button"
                      onClick={() => jumpToChapter(ch.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        activeChapterId === ch.id
                          ? 'cadence-seam bg-[#1C1815]/90 font-semibold text-[#EDE3D2]'
                          : 'text-[#A69B8D] hover:bg-[#13110F] hover:text-[#EDE3D2]'
                      }`}
                    >
                      <span className="font-mono text-[11px] text-[#E12D1C] tabular-nums">{ch.number}</span>
                      <span className="truncate">{ch.shortTitle}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <button
              type="button"
              onClick={() => window.print()}
              className="cadence-keycap flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium text-[#EDE3D2]"
            >
              <Printer className="h-3.5 w-3.5 text-[#E12D1C]" />
              <span>Print Specification</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <div className="mx-auto max-w-[940px]">
            <header className="mb-10 pb-8 shadow-[inset_0_-1px_0_rgba(237,227,210,0.08)]">
              <div className="cadence-seam">
                <div className="font-mono text-xs text-[#E12D1C]">
                  Version {DOC_METADATA.version} · {DOC_METADATA.date} · {CADENCE_CHAPTERS.length} Chapters
                </div>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#EDE3D2]">
                  {DOC_METADATA.productName} — {DOC_METADATA.docTitle}
                </h1>
                <p className="mt-2 text-sm text-[#A69B8D]">{DOC_METADATA.subtitle}</p>
              </div>
            </header>

            <div className="space-y-12">
              {filteredChapters.map((chapter) => (
                <ChapterView key={chapter.id} chapter={chapter} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
