import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { CADENCE_CHAPTERS, DOC_METADATA, type DocChapter, type DocTable } from '../src/data/cadenceDocs.ts';

const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const MARGIN_TOP = 62;
const MARGIN_BOTTOM = 62;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const PAGE_BOTTOM = PAGE_HEIGHT - MARGIN_BOTTOM;

const COLORS = {
  ink: '#0A0908',
  body: '#3B342E',
  muted: '#6E655B',
  accent: '#E12D1C',
  accentSoft: '#FDF2F0',
  border: '#E2D8C8',
  surface: '#FAF6F0',
  codeBg: '#0A0908',
  codeText: '#EDE3D2',
  white: '#FFFFFF',
  green: '#3B342E',
  amber: '#E12D1C',
};

interface ChapterPageEntry {
  number: string;
  title: string;
  category: string;
  pageNumber: number; // 1-indexed
}

function pdfSafe(input: string): string {
  return String(input ?? '')
    .replace(/├──/g, '+--')
    .replace(/└──/g, '+--')
    .replace(/│/g, '|  ')
    .replace(/─/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↔/g, '<->')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/×/g, 'x')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, '*')
    .replace(/·/g, '-')
    .replace(/[^\x20-\x7E\n\r\t\xA0-\xFF]/g, '');
}

function wrapCodeLine(line: string, maxChars = 98): string[] {
  const safe = pdfSafe(line);
  if (safe.length <= maxChars) return [safe];
  const out: string[] = [];
  let remaining = safe;
  while (remaining.length > maxChars) {
    let cut = remaining.lastIndexOf(' ', maxChars);
    if (cut < Math.floor(maxChars * 0.45)) cut = maxChars;
    out.push(remaining.slice(0, cut));
    remaining = '  ' + remaining.slice(cut).trimStart();
  }
  if (remaining.length > 0) out.push(remaining);
  return out;
}

function generatePdf(outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_X, right: MARGIN_X },
      bufferPages: true,
      info: {
        Title: pdfSafe(`${DOC_METADATA.productName} - ${DOC_METADATA.docTitle}`),
        Author: pdfSafe(DOC_METADATA.author),
        Subject: pdfSafe(DOC_METADATA.subtitle),
        Keywords:
          'Cadence, PRD, TRD, MongoDB, SQLite, Vercel, 2D Chronograph, UI/UX, Codebase, Security, Instructor Q&A, VS Code Extension, Chrome Extension',
      },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    let y = MARGIN_TOP;
    const chapterTocEntries: ChapterPageEntry[] = [];
    const pageChapterTitles = new Map<number, string>();

    const currentPageIndex = () => doc.bufferedPageRange().count - 1;

    const addNewPage = (runningTitle?: string) => {
      doc.addPage();
      y = MARGIN_TOP;
      if (runningTitle) {
        pageChapterTitles.set(currentPageIndex(), pdfSafe(runningTitle));
      }
    };

    const ensureSpace = (needed: number, runningTitle?: string) => {
      if (y + needed > PAGE_BOTTOM) {
        addNewPage(runningTitle);
      }
    };

    // ---------------- COVER PAGE (Page 0) ----------------
    doc.rect(0, 0, PAGE_WIDTH, 10).fill(COLORS.accent);

    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.accent);
    doc.text('ENGINEERING & PRODUCT SPECIFICATION', MARGIN_X, 95, { characterSpacing: 1.5 });

    doc.font('Helvetica-Bold').fontSize(38).fillColor(COLORS.ink);
    doc.text(pdfSafe(DOC_METADATA.productName), MARGIN_X, 125);

    doc.font('Helvetica').fontSize(15).fillColor(COLORS.body);
    doc.text(pdfSafe(DOC_METADATA.subtitle), MARGIN_X, 178, { width: CONTENT_WIDTH, lineGap: 4 });

    doc.moveTo(MARGIN_X, 240).lineTo(MARGIN_X + 120, 240).lineWidth(2.5).strokeColor(COLORS.accent).stroke();

    // Metadata grid card
    const metaBoxY = 275;
    doc.roundedRect(MARGIN_X, metaBoxY, CONTENT_WIDTH, 155, 6).fillAndStroke(COLORS.surface, COLORS.border);

    const metaPairs: [string, string][] = [
      ['Document', pdfSafe(DOC_METADATA.docTitle)],
      ['Version & Date', pdfSafe(`v${DOC_METADATA.version} - ${DOC_METADATA.date}`)],
      ['Core Stack', pdfSafe(DOC_METADATA.stack)],
      [
        'Coverage',
        'PRD, SPA Routes & Auth, Session Engine, Mobile Sync, MongoDB/SQLite Schemas, Extensions, Codebase Map, System Security, 2D Chronograph & UI/UX Rationale, and Instructor Viva Q&A',
      ],
    ];

    let metaY = metaBoxY + 18;
    for (const [k, v] of metaPairs) {
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.muted).text(k.toUpperCase(), MARGIN_X + 18, metaY, { width: 110 });
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.ink).text(v, MARGIN_X + 135, metaY, { width: CONTENT_WIDTH - 155, lineGap: 2 });
      metaY += k === 'Coverage' ? 42 : 28;
    }

    // Scope highlights on Cover
    doc.font('Helvetica-Bold').fontSize(11).fillColor(COLORS.ink).text('Included Architectural Blueprints (16 Chapters)', MARGIN_X, 462);
    const highlights = [
      '01-03. Product PRD, Complete SPA Route Map, Auth Guards & OAuth / JWT Rotation',
      '04-06. Server-Authoritative Timer, Pause Gate, Multi-Device Sync & 13-Cat Tools',
      '07-09. AI Reference Cards, Accuracy-Weighted XP, MongoDB Schemas & REST Contracts',
      '10-11. Unified IDE (.vsix) & Chrome MV3 Extensions, Vercel Cron & Showcase Pitch',
      '12. Complete Codebase Map & File-by-File Architectural Responsibility Inventory',
      '13. System Design & Defense-in-Depth Security (Dual DB, scrypt, SSRF, Lapse)',
      '14. UI/UX Surface Hierarchy & 2D Scroll Chronograph Engineering Meaning',
      '15. Instructor Defense & Technical Viva Q&A Matrix Across All Layers',
      '16. v1.3.0 Role Onboarding, 6 Dashboard Lenses, Hubs, Companion Launcher & Search',
    ];
    let hy = 484;
    for (const h of highlights) {
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.body).text(h, MARGIN_X + 8, hy, { width: CONTENT_WIDTH - 16 });
      hy += 18;
    }

    // ---------------- TABLE OF CONTENTS PLACEHOLDER (Page 1) ----------------
    doc.addPage();
    const tocPageIndex = currentPageIndex();
    pageChapterTitles.set(tocPageIndex, 'Table of Contents');

    // ---------------- RENDER CHAPTERS ----------------
    const drawParagraph = (text: string, runningTitle: string) => {
      const safe = pdfSafe(text);
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.body);
      const h = doc.heightOfString(safe, { width: CONTENT_WIDTH, lineGap: 3 });
      ensureSpace(h + 10, runningTitle);
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.body).text(safe, MARGIN_X, y, {
        width: CONTENT_WIDTH,
        lineGap: 3,
      });
      y += h + 9;
    };

    const drawBullets = (items: string[], numbered: boolean, runningTitle: string) => {
      items.forEach((rawItem, idx) => {
        const item = pdfSafe(rawItem);
        const prefix = numbered ? `${idx + 1}.` : '-';
        doc.font('Helvetica').fontSize(9.5);
        const h = doc.heightOfString(item, { width: CONTENT_WIDTH - 20, lineGap: 2.5 });
        ensureSpace(h + 8, runningTitle);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.accent).text(prefix, MARGIN_X + 4, y, { width: 16 });
        doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.body).text(item, MARGIN_X + 20, y, {
          width: CONTENT_WIDTH - 20,
          lineGap: 2.5,
        });
        y += h + 6;
      });
      y += 4;
    };

    const drawTable = (table: DocTable, runningTitle: string) => {
      const colCount = table.headers.length;
      let colWidths: number[];
      if (colCount === 2) {
        colWidths = [CONTENT_WIDTH * 0.3, CONTENT_WIDTH * 0.7];
      } else if (colCount === 3) {
        colWidths = [CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.36, CONTENT_WIDTH * 0.42];
      } else if (colCount === 4) {
        colWidths = [CONTENT_WIDTH * 0.16, CONTENT_WIDTH * 0.24, CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.38];
      } else if (colCount === 5) {
        colWidths = [CONTENT_WIDTH * 0.14, CONTENT_WIDTH * 0.2, CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.22];
      } else {
        colWidths = Array(colCount).fill(CONTENT_WIDTH / colCount);
      }

      if (table.title) {
        ensureSpace(45, runningTitle);
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.ink).text(pdfSafe(table.title), MARGIN_X, y);
        y += 15;
      }

      const safeHeaders = table.headers.map(pdfSafe);

      const drawHeaderRow = () => {
        let maxHeaderH = 18;
        doc.font('Helvetica-Bold').fontSize(8);
        safeHeaders.forEach((hdr, i) => {
          const h = doc.heightOfString(hdr, { width: colWidths[i] - 10 });
          if (h + 10 > maxHeaderH) maxHeaderH = h + 10;
        });
        doc.rect(MARGIN_X, y, CONTENT_WIDTH, maxHeaderH).fillAndStroke(COLORS.ink, COLORS.ink);
        let cx = MARGIN_X;
        safeHeaders.forEach((hdr, i) => {
          doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.white).text(hdr, cx + 5, y + 5, {
            width: colWidths[i] - 10,
          });
          cx += colWidths[i];
        });
        y += maxHeaderH;
      };

      ensureSpace(46, runningTitle);
      drawHeaderRow();

      table.rows.forEach((rawRow, rIdx) => {
        const row = rawRow.map(pdfSafe);
        doc.font('Helvetica').fontSize(8);
        let rowH = 18;
        row.forEach((cell, i) => {
          doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
          const h = doc.heightOfString(cell, { width: colWidths[i] - 10, lineGap: 1.5 });
          if (h + 10 > rowH) rowH = h + 10;
        });

        if (y + rowH > PAGE_BOTTOM) {
          addNewPage(runningTitle);
          drawHeaderRow();
        }

        const bg = rIdx % 2 === 1 ? COLORS.surface : COLORS.white;
        doc.rect(MARGIN_X, y, CONTENT_WIDTH, rowH).fillAndStroke(bg, COLORS.border);

        let cx = MARGIN_X;
        row.forEach((cell, i) => {
          const isFirstCol = i === 0;
          doc
            .font(isFirstCol ? 'Helvetica-Bold' : 'Helvetica')
            .fontSize(8)
            .fillColor(isFirstCol ? COLORS.ink : COLORS.body)
            .text(cell, cx + 5, y + 5, { width: colWidths[i] - 10, lineGap: 1.5 });
          if (i > 0) {
            doc.moveTo(cx, y).lineTo(cx, y + rowH).lineWidth(0.5).strokeColor(COLORS.border).stroke();
          }
          cx += colWidths[i];
        });

        y += rowH;
      });
      y += 12;
    };

    const drawCodeBlock = (title: string, code: string, runningTitle: string) => {
      const rawLines = code.split('\n').flatMap((l) => wrapCodeLine(l, 96));
      const lineHeight = 10.2;
      const boxPadding = 10;

      ensureSpace(45, runningTitle);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.accent).text(pdfSafe(title), MARGIN_X, y);
      y += 13;

      let lineIdx = 0;
      while (lineIdx < rawLines.length) {
        const availableH = PAGE_BOTTOM - y - boxPadding * 2;
        const maxLinesHere = Math.max(3, Math.floor(availableH / lineHeight));
        const chunk = rawLines.slice(lineIdx, lineIdx + maxLinesHere);
        const chunkHeight = chunk.length * lineHeight + boxPadding * 2;

        if (y + chunkHeight > PAGE_BOTTOM && lineIdx === 0 && rawLines.length * lineHeight + 24 < PAGE_BOTTOM - MARGIN_TOP) {
          addNewPage(runningTitle);
          continue;
        }

        doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, chunkHeight, 4).fill(COLORS.codeBg);
        let cy = y + boxPadding;
        doc.font('Courier').fontSize(7.2).fillColor(COLORS.codeText);
        for (const line of chunk) {
          doc.text(line, MARGIN_X + 10, cy, { width: CONTENT_WIDTH - 20, lineBreak: false });
          cy += lineHeight;
        }
        y += chunkHeight + 10;
        lineIdx += chunk.length;
        if (lineIdx < rawLines.length) {
          addNewPage(runningTitle);
        }
      }
    };

    const drawDiagram = (type: DocChapter['diagramType'], runningTitle: string) => {
      if (!type) return;
      ensureSpace(145, runningTitle);
      const boxTop = y;
      const boxH = 132;
      doc.roundedRect(MARGIN_X, boxTop, CONTENT_WIDTH, boxH, 5).fillAndStroke(COLORS.surface, COLORS.border);

      const drawNode = (x: number, ny: number, w: number, h: number, label: string, sub: string, fill = COLORS.white, border = COLORS.accent) => {
        doc.roundedRect(x, ny, w, h, 4).fillAndStroke(fill, border);
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.ink).text(pdfSafe(label), x + 4, ny + 7, { width: w - 8, align: 'center' });
        if (sub) {
          doc.font('Helvetica').fontSize(6.8).fillColor(COLORS.muted).text(pdfSafe(sub), x + 4, ny + 19, { width: w - 8, align: 'center' });
        }
      };

      const drawArrow = (x1: number, y1: number, x2: number, y2: number, label?: string) => {
        doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(1).strokeColor(COLORS.muted).stroke();
        if (Math.abs(x2 - x1) > Math.abs(y2 - y1)) {
          const dir = x2 > x1 ? -1 : 1;
          doc.moveTo(x2, y2).lineTo(x2 + dir * 4, y2 - 2.5).lineTo(x2 + dir * 4, y2 + 2.5).fill(COLORS.muted);
        } else {
          const dir = y2 > y1 ? -1 : 1;
          doc.moveTo(x2, y2).lineTo(x2 - 2.5, y2 + dir * 4).lineTo(x2 + 2.5, y2 + dir * 4).fill(COLORS.muted);
        }
        if (label) {
          doc.font('Helvetica').fontSize(6.5).fillColor(COLORS.accent).text(pdfSafe(label), Math.min(x1, x2) + 2, Math.min(y1, y2) - 9, { width: Math.abs(x2 - x1) || 60, align: 'center' });
        }
      };

      if (type === 'auth-redirect') {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('DIAGRAM -- AUTHENTICATION & PAGE REDIRECT FLOW', MARGIN_X + 12, boxTop + 8);
        drawNode(MARGIN_X + 14, boxTop + 32, 86, 36, 'Request Route', '/dashboard, etc.');
        drawArrow(MARGIN_X + 100, boxTop + 50, MARGIN_X + 130, boxTop + 50);
        drawNode(MARGIN_X + 130, boxTop + 32, 95, 36, 'Auth Guard', 'Valid JWT / Cookie?');
        drawArrow(MARGIN_X + 225, boxTop + 50, MARGIN_X + 265, boxTop + 50, 'Yes');
        drawNode(MARGIN_X + 265, boxTop + 32, 95, 36, 'Onboarded?', 'Profile complete?');
        drawArrow(MARGIN_X + 360, boxTop + 50, MARGIN_X + 398, boxTop + 50, 'Yes');
        drawNode(MARGIN_X + 398, boxTop + 32, 84, 36, 'Target View', 'Active / Focus', COLORS.accentSoft);
        drawArrow(MARGIN_X + 177, boxTop + 68, MARGIN_X + 177, boxTop + 88);
        drawNode(MARGIN_X + 125, boxTop + 88, 105, 32, '/login?redirect=...', 'No JWT -> Sign In', COLORS.white, COLORS.amber);
        drawArrow(MARGIN_X + 312, boxTop + 68, MARGIN_X + 312, boxTop + 88);
        drawNode(MARGIN_X + 260, boxTop + 88, 105, 32, '/onboarding', 'Incomplete -> Setup', COLORS.white, COLORS.amber);
      } else if (type === 'session-state') {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('DIAGRAM -- SERVER-AUTHORITATIVE SESSION STATE MACHINE', MARGIN_X + 12, boxTop + 8);
        drawNode(MARGIN_X + 14, boxTop + 44, 72, 36, 'Planned', 'Checkpoints set');
        drawArrow(MARGIN_X + 86, boxTop + 62, MARGIN_X + 116, boxTop + 62, 'Start');
        drawNode(MARGIN_X + 116, boxTop + 44, 88, 36, 'Active', '30s Heartbeat', COLORS.accentSoft);
        drawArrow(MARGIN_X + 204, boxTop + 55, MARGIN_X + 244, boxTop + 55, 'Pause');
        drawArrow(MARGIN_X + 244, boxTop + 69, MARGIN_X + 204, boxTop + 69, 'Resume');
        drawNode(MARGIN_X + 244, boxTop + 44, 92, 36, 'Paused', 'Reason + Alarm');
        drawArrow(MARGIN_X + 336, boxTop + 62, MARGIN_X + 382, boxTop + 40, 'End');
        drawNode(MARGIN_X + 382, boxTop + 26, 98, 32, 'Completed', 'Title + XP Awarded', COLORS.white, COLORS.green);
        drawArrow(MARGIN_X + 160, boxTop + 80, MARGIN_X + 160, boxTop + 98);
        drawNode(MARGIN_X + 100, boxTop + 96, 128, 28, 'Lapsed (App Closed)', 'Cron @ lastHeartbeat', COLORS.white, COLORS.amber);
        drawArrow(MARGIN_X + 336, boxTop + 70, MARGIN_X + 382, boxTop + 90, 'Cancel');
        drawNode(MARGIN_X + 382, boxTop + 78, 98, 32, 'Abandoned', '0 XP Audit Log', COLORS.white, COLORS.border);
      } else if (type === 'device-handoff') {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('DIAGRAM -- DESKTOP WEB <-> MOBILE LIVE SESSION HANDOFF', MARGIN_X + 12, boxTop + 8);
        drawNode(MARGIN_X + 18, boxTop + 42, 118, 42, 'Desktop Web App', 'Starts Session (web)', COLORS.accentSoft);
        drawArrow(MARGIN_X + 136, boxTop + 63, MARGIN_X + 186, boxTop + 63, '30s Sync');
        drawNode(MARGIN_X + 186, boxTop + 34, 125, 58, 'MongoDB Session', 'currentDevice + deviceEvents[]');
        drawArrow(MARGIN_X + 311, boxTop + 63, MARGIN_X + 360, boxTop + 63, 'Handoff');
        drawNode(MARGIN_X + 360, boxTop + 42, 118, 42, 'Mobile View', 'Pause / End / Alarms', COLORS.accentSoft);
      } else if (type === 'three-layer-tracking') {
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.muted).text('DIAGRAM -- 3-LAYER TOOL TELEMETRY PIPELINE (METADATA ONLY)', MARGIN_X + 12, boxTop + 8);
        drawNode(MARGIN_X + 16, boxTop + 28, 130, 28, 'L1: VS Code / Cursor Ext', 'App + Lang + Git');
        drawNode(MARGIN_X + 16, boxTop + 62, 130, 28, 'L2: Chrome MV3 Ext', 'Selected AI Domains');
        drawNode(MARGIN_X + 16, boxTop + 96, 130, 28, 'L3: Web / Mobile App', 'Manual Switch + Links');
        drawArrow(MARGIN_X + 146, boxTop + 42, MARGIN_X + 195, boxTop + 68);
        drawArrow(MARGIN_X + 146, boxTop + 76, MARGIN_X + 195, boxTop + 76);
        drawArrow(MARGIN_X + 146, boxTop + 110, MARGIN_X + 195, boxTop + 84);
        drawNode(MARGIN_X + 195, boxTop + 50, 130, 50, 'POST /api/activity', 'Scoped Token + 2m Idle Gate', COLORS.accentSoft);
        drawArrow(MARGIN_X + 325, boxTop + 75, MARGIN_X + 365, boxTop + 75);
        drawNode(MARGIN_X + 365, boxTop + 50, 114, 50, 'Checkpoint Stats', 'Tool Split & XP');
      }

      y = boxTop + boxH + 14;
    };

    for (const chapter of CADENCE_CHAPTERS) {
      addNewPage(`${chapter.number}. ${chapter.shortTitle}`);
      const chapterStartPage = currentPageIndex() + 1;
      chapterTocEntries.push({
        number: chapter.number,
        title: pdfSafe(chapter.title),
        category: pdfSafe(chapter.category),
        pageNumber: chapterStartPage,
      });

      // Chapter Banner
      doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.accent).text(pdfSafe(`CHAPTER ${chapter.number} - ${chapter.category.toUpperCase()}`), MARGIN_X, y);
      y += 14;
      doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.ink).text(pdfSafe(chapter.title), MARGIN_X, y, { width: CONTENT_WIDTH });
      y += doc.heightOfString(pdfSafe(chapter.title), { width: CONTENT_WIDTH }) + 6;
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.muted).text(pdfSafe(chapter.summary), MARGIN_X, y, { width: CONTENT_WIDTH, lineGap: 2.5 });
      y += doc.heightOfString(pdfSafe(chapter.summary), { width: CONTENT_WIDTH, lineGap: 2.5 }) + 10;
      doc.moveTo(MARGIN_X, y).lineTo(MARGIN_X + CONTENT_WIDTH, y).lineWidth(1).strokeColor(COLORS.border).stroke();
      y += 14;

      if (chapter.diagramType) {
        drawDiagram(chapter.diagramType, `${chapter.number}. ${chapter.shortTitle}`);
      }

      for (const sub of chapter.subsections) {
        ensureSpace(40, `${chapter.number}. ${chapter.shortTitle}`);
        doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.ink).text(pdfSafe(sub.title), MARGIN_X, y, { width: CONTENT_WIDTH });
        y += doc.heightOfString(pdfSafe(sub.title), { width: CONTENT_WIDTH }) + 8;

        if (sub.paragraphs) {
          for (const p of sub.paragraphs) {
            drawParagraph(p, `${chapter.number}. ${chapter.shortTitle}`);
          }
        }
        if (sub.bullets) {
          drawBullets(sub.bullets, false, `${chapter.number}. ${chapter.shortTitle}`);
        }
        if (sub.orderedList) {
          drawBullets(sub.orderedList, true, `${chapter.number}. ${chapter.shortTitle}`);
        }
        if (sub.callout) {
          const safeCalloutBody = pdfSafe(sub.callout.body);
          doc.font('Helvetica').fontSize(9);
          const ch = doc.heightOfString(safeCalloutBody, { width: CONTENT_WIDTH - 24, lineGap: 2 }) + 30;
          ensureSpace(ch + 10, `${chapter.number}. ${chapter.shortTitle}`);
          doc.roundedRect(MARGIN_X, y, CONTENT_WIDTH, ch, 4).fillAndStroke(COLORS.accentSoft, COLORS.accent);
          doc.font('Helvetica-Bold').fontSize(8.5).fillColor(COLORS.accent).text(pdfSafe(sub.callout.label), MARGIN_X + 12, y + 9);
          doc.font('Helvetica').fontSize(9).fillColor(COLORS.ink).text(safeCalloutBody, MARGIN_X + 12, y + 23, { width: CONTENT_WIDTH - 24, lineGap: 2 });
          y += ch + 10;
        }
        if (sub.tables) {
          for (const t of sub.tables) {
            drawTable(t, `${chapter.number}. ${chapter.shortTitle}`);
          }
        }
        if (sub.codeBlocks) {
          for (const cb of sub.codeBlocks) {
            drawCodeBlock(cb.title, cb.code, `${chapter.number}. ${chapter.shortTitle}`);
          }
        }
        y += 6;
      }
    }

    // ---------------- POPULATE TABLE OF CONTENTS (Page 1) ----------------
    doc.switchToPage(tocPageIndex);
    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
    doc.font('Helvetica-Bold').fontSize(18).fillColor(COLORS.ink).text('Table of Contents', MARGIN_X, MARGIN_TOP);
    doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.muted).text('Complete system blueprint covering product scope, routing, authentication, timer engine, schemas, extensions, and deployment.', MARGIN_X, MARGIN_TOP + 26, { width: CONTENT_WIDTH });
    doc.moveTo(MARGIN_X, MARGIN_TOP + 54).lineTo(MARGIN_X + CONTENT_WIDTH, MARGIN_TOP + 54).lineWidth(1).strokeColor(COLORS.border).stroke();

    let tocY = MARGIN_TOP + 68;
    for (const entry of chapterTocEntries) {
      if (tocY + 34 > PAGE_BOTTOM) {
        break;
      }
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.accent).text(entry.number, MARGIN_X, tocY, { width: 24, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.ink).text(entry.title, MARGIN_X + 26, tocY, { width: CONTENT_WIDTH - 95, lineBreak: false });
      doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.muted).text(entry.category, MARGIN_X + 26, tocY + 12, { width: 220, lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.ink).text(`p. ${entry.pageNumber}`, PAGE_WIDTH - MARGIN_X - 45, tocY, { width: 45, align: 'right', lineBreak: false });
      doc.moveTo(MARGIN_X, tocY + 25).lineTo(MARGIN_X + CONTENT_WIDTH, tocY + 25).lineWidth(0.5).strokeColor(COLORS.border).stroke();
      tocY += 34;
    }

    // ---------------- STAMP HEADERS & FOOTERS ON ALL PAGES ----------------
    const range = doc.bufferedPageRange();
    const totalPages = range.count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      // Zero page margins during header/footer stamping so PDFKit never spawns blank overflow pages
      doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 };
      if (i > 0) {
        const running = pageChapterTitles.get(i) || pdfSafe(DOC_METADATA.productName);
        doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(pdfSafe(`${DOC_METADATA.productName} - Complete Engineering Documentation`), MARGIN_X, 26, { width: 280, lineBreak: false });
        doc.font('Helvetica-Bold').fontSize(8).fillColor(COLORS.ink).text(running, PAGE_WIDTH - MARGIN_X - 200, 26, { width: 200, align: 'right', lineBreak: false });
        doc.moveTo(MARGIN_X, 42).lineTo(MARGIN_X + CONTENT_WIDTH, 42).lineWidth(0.5).strokeColor(COLORS.border).stroke();
      }
      doc.moveTo(MARGIN_X, PAGE_HEIGHT - 44).lineTo(MARGIN_X + CONTENT_WIDTH, PAGE_HEIGHT - 44).lineWidth(0.5).strokeColor(COLORS.border).stroke();
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(pdfSafe(`Cadence v${DOC_METADATA.version} - ${DOC_METADATA.date}`), MARGIN_X, PAGE_HEIGHT - 34, { width: 260, lineBreak: false });
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.muted).text(`Page ${i + 1} of ${totalPages}`, PAGE_WIDTH - MARGIN_X - 100, PAGE_HEIGHT - 34, { width: 100, align: 'right', lineBreak: false });
    }

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
}

const outFile = path.resolve(process.cwd(), 'public/Cadence_Complete_Documentation.pdf');
generatePdf(outFile)
  .then(() => {
    const stats = fs.statSync(outFile);
    console.log(`Generated ${outFile} (${Math.round(stats.size / 1024)} KB)`);
  })
  .catch((err) => {
    console.error('Failed to generate PDF:', err);
    process.exit(1);
  });
