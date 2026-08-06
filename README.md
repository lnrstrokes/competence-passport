# Competence Passport

AI-verified competence passports for skilled Nigerian operators — built for the
10Alytics AI BuildFest 2026.

**Problem:** Resumes don't carry competence — they carry claims. International
recruiters can't verify what a worker can actually do, so skilled operators get
filtered out.

**Solution:** A verified, shareable Competence Passport built on video proof,
machine/terrain taxonomies, and a deterministic BACS evidence score — with AI
normalizing local skills to international standards.

## Architecture (BACS layers)

| Layer | Location | Responsibility |
|---|---|---|
| Presentation | `app/`, `components/` | UI only — no business logic |
| Behavioral | `lib/behavioral.ts` | Trust signals, CTA hierarchy, friction reducers |
| Algorithmic | `lib/bacs.ts`, `lib/llm.ts` | Deterministic scoring + AI augmentation |
| Data | `lib/sheet.ts`, `lib/schema.ts` | Google Sheet CSV ingestion |

The BACS score is **deterministic code** (`lib/bacs.ts` + `config/bacs.ts`).
AI never touches the score — it normalizes skills, extracts evidence, and
explains matches.

## AI failover

`lib/llm.ts` tries the primary provider (Groq, ~1,000 req/day free), and
automatically falls back to SambaNova (~20 req/day free) on any failure.
The response reports which provider served the call.

## Stack

Next.js 15 (App Router) · TypeScript · Vercel (serverless API routes) ·
Google Sheets as headless CMS · OpenAI-compatible LLM providers (Groq + SambaNova).

## Environment variables

See `.env.example`. Set in Vercel: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`,
`AI_FALLBACK_API_KEY`, `AI_FALLBACK_BASE_URL`, `AI_FALLBACK_MODEL`,
`SHEET_CSV_URL`.

> `config/bacs.ts` contains proprietary BACS methodology weights.