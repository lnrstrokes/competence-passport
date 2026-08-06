interface Provider {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface CompleteJsonOptions {
  system: string;
  user: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LlmResult<T> {
  data: T;
  provider: string;
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.AI_API_KEY) {
    const baseUrl = (process.env.AI_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
    providers.push({
      name: providerName(baseUrl),
      baseUrl,
      apiKey: process.env.AI_API_KEY,
      model: process.env.AI_MODEL ?? "llama-3.3-70b-versatile",
    });
  }

  if (process.env.AI_FALLBACK_API_KEY) {
    const baseUrl = (process.env.AI_FALLBACK_BASE_URL ?? "https://api.sambanova.ai/v1").replace(/\/$/, "");
    providers.push({
      name: providerName(baseUrl),
      baseUrl,
      apiKey: process.env.AI_FALLBACK_API_KEY,
      model: process.env.AI_FALLBACK_MODEL ?? "Meta-Llama-3.3-70B-Instruct",
    });
  }

  return providers;
}

function providerName(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return "unknown-provider";
  }
}

export async function completeJson<T>(options: CompleteJsonOptions): Promise<LlmResult<T>> {
  const providers = buildProviders();
  if (providers.length === 0) {
    throw new Error("No AI provider configured. Set AI_API_KEY (and optionally AI_FALLBACK_API_KEY) in Vercel.");
  }

  const errors: string[] = [];
  for (const provider of providers) {
    try {
      const data = await requestOnce<T>(provider, options);
      return { data, provider: provider.name };
    } catch (error) {
      errors.push(
        `${provider.name} (${provider.model}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(`All AI providers failed. ${errors.join(" | ")}`);
}

async function requestOnce<T>(provider: Provider, options: CompleteJsonOptions): Promise<T> {
  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.2,
      max_tokens: options.maxTokens ?? 1024,
      messages: [
        {
          role: "system",
          content: `${options.system}\nRespond with valid JSON only. No markdown, no commentary, no code fences.`,
        },
        { role: "user", content: options.user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  return parseJsonObject<T>(content);
}

function parseJsonObject<T>(content: string): T {
  const cleaned = content.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Response contained no JSON object.");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}