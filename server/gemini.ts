import { GoogleGenAI, Type } from '@google/genai';
import type {
  DocumentSummaryCard,
  GroundingSource,
  SearchDiscoveryResult,
  SkillLevel,
  ToolCategory,
} from '../src/types/cadence.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractGroundingSources(response: unknown): GroundingSource[] {
  const resObj = response as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      };
    }>;
  };
  const chunks = resObj?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const seen = new Set<string>();
  const sources: GroundingSource[] = [];
  for (const ch of chunks) {
    const uri = ch?.web?.uri;
    const title = ch?.web?.title || uri;
    if (uri && title && !seen.has(uri)) {
      seen.add(uri);
      sources.push({ title, uri });
    }
  }
  return sources.slice(0, 8);
}

const VALID_CATEGORIES = new Set<ToolCategory>([
  'dev',
  'design',
  'research',
  'review',
  'testing',
  'deployment',
  'clientele',
]);

export async function discoverStackWithSearch(params: {
  query: string;
  skillLevel: SkillLevel;
  mode: 'personal' | 'business' | 'learning';
}): Promise<SearchDiscoveryResult> {
  const ai = getAiClient();
  const prompt = `You are helping configure a developer accountability session in Cadence.
User skill level: ${params.skillLevel}
Session mode: ${params.mode}
Developer goal or tech stack query: "${params.query}"

Use Google Search to gather current, accurate tools, official documentation URLs, realistic checkpoint durations, and practical guidance tailored to a ${params.skillLevel} builder (including vibe coders or beginners if applicable).

Return ONLY valid JSON matching this exact structure (no markdown code fences):
{
  "summary": "2-sentence overview tailored to their skill level and goal",
  "recommendedTools": [
    {
      "name": "Tool Name",
      "slug": "tool-slug",
      "categories": ["dev"],
      "description": "One concise sentence on why it fits",
      "docsUrl": "https://...",
      "domainPattern": "example.com"
    }
  ],
  "suggestedCheckpoints": [
    {
      "category": "dev",
      "title": "Actionable checkpoint title",
      "plannedMinutes": 45,
      "guidance": "Concrete tip for completing this checkpoint cleanly"
    }
  ],
  "beginnerTips": ["Practical guardrail 1", "Practical guardrail 2", "Practical guardrail 3"]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const sources = extractGroundingSources(response);
  const raw = (response.text || '').trim();
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  let parsed: Partial<SearchDiscoveryResult> = {};
  try {
    parsed = JSON.parse(cleaned) as Partial<SearchDiscoveryResult>;
  } catch {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as Partial<SearchDiscoveryResult>;
    } else {
      throw new Error('Could not parse structured search recommendations from Gemini response.');
    }
  }

  const safeTools = (parsed.recommendedTools || []).slice(0, 6).map((t) => ({
    name: String(t.name || 'Tool'),
    slug: String(t.slug || t.name || 'tool')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    categories: (Array.isArray(t.categories) ? t.categories : (['dev'] as ToolCategory[])).filter(
      (c): c is ToolCategory => VALID_CATEGORIES.has(c as ToolCategory)
    ),
    description: String(t.description || ''),
    docsUrl: String(t.docsUrl || ''),
    domainPattern: String(t.domainPattern || ''),
  }));

  const safeCheckpoints = (parsed.suggestedCheckpoints || []).slice(0, 6).map((c) => ({
    category: VALID_CATEGORIES.has(c.category) ? c.category : ('dev' as ToolCategory),
    title: String(c.title || 'Build Checkpoint'),
    plannedMinutes: Math.max(15, Math.min(240, Number(c.plannedMinutes) || 45)),
    guidance: String(c.guidance || ''),
  }));

  return {
    summary: String(parsed.summary || 'Curated workflow based on live web search.'),
    recommendedTools: safeTools,
    suggestedCheckpoints: safeCheckpoints,
    beginnerTips: Array.isArray(parsed.beginnerTips) ? parsed.beginnerTips.map(String).slice(0, 4) : [],
    sources,
  };
}

export async function summarizeProjectDocument(params: {
  fileName: string;
  rawText: string;
  projectType: string;
}): Promise<DocumentSummaryCard> {
  const ai = getAiClient();
  const clippedText = params.rawText.slice(0, 18000);

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Analyze this ${params.projectType} project document ("${params.fileName}") and build a concise Developer Focus Reference Card with actionable deliverables, technical constraints, and suggested Cadence checkpoints.\n\nDOCUMENT CONTENT:\n${clippedText}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          headline: { type: Type.STRING, description: 'One concise sentence summarizing the document goal.' },
          deliverables: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 5 concrete deliverables.',
          },
          constraints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 to 4 technical, timeline, or scope constraints.',
          },
          suggestedCheckpoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: {
                  type: Type.STRING,
                  description: 'One of: dev, design, research, review, testing, deployment, clientele',
                },
                title: { type: Type.STRING },
                plannedMinutes: { type: Type.INTEGER },
              },
            },
          },
        },
      },
    },
  });

  const json = JSON.parse((response.text || '{}').trim()) as Partial<DocumentSummaryCard>;
  return {
    headline: String(json.headline || `Summary for ${params.fileName}`),
    deliverables: Array.isArray(json.deliverables) ? json.deliverables.map(String).slice(0, 5) : [],
    constraints: Array.isArray(json.constraints) ? json.constraints.map(String).slice(0, 4) : [],
    suggestedCheckpoints: (json.suggestedCheckpoints || []).slice(0, 5).map((cp) => ({
      category: VALID_CATEGORIES.has(cp.category) ? cp.category : 'dev',
      title: String(cp.title || 'Implementation Checkpoint'),
      plannedMinutes: Math.max(15, Math.min(240, Number(cp.plannedMinutes) || 45)),
    })),
  };
}

export async function fetchCheckpointGuideWithSearch(params: {
  checkpointTitle: string;
  category: ToolCategory;
  stack: string[];
  skillLevel: SkillLevel;
}): Promise<{ answer: string; sources: GroundingSource[] }> {
  const ai = getAiClient();
  const stackStr = params.stack.length > 0 ? params.stack.join(', ') : 'modern web stack';
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Give a concise, practical step-by-step execution guide for a ${params.skillLevel} developer working on checkpoint "${params.checkpointTitle}" (${params.category}) using ${stackStr}. Use Google Search for up-to-date official documentation and best practices. Keep it crisp and actionable (max 5 bullet points).`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    answer: (response.text || '').trim(),
    sources: extractGroundingSources(response),
  };
}
