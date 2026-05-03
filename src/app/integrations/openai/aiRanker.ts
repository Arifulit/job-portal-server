
// integrations/gemini/aiRanker.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  return new GoogleGenerativeAI(apiKey);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scoreCandidateWithAI(
  jobDescription: string,
  candidate: { name: string; skills?: string[]; experience?: number; [key: string]: unknown }
): Promise<{ score: number; reasons: string[] }> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 500,
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are an expert technical recruiter. Score this candidate for the job and return ONLY a JSON object (no markdown, no extra text):
{
  "score": <number 0-100>,
  "reasons": [<string>, <string>, <string>]
}

Job Description: ${jobDescription}

Candidate:
- Name: ${candidate.name}
- Skills: ${(candidate.skills as string[] | undefined)?.join(", ") || "N/A"}
- Experience: ${(candidate.experience as number | undefined) ?? 0} years

Rules:
- score = how well this candidate fits the job (0-100)
- reasons = 3 short bullet points explaining the score (strengths & gaps)`;

  let lastError: Error | null = null;

  // resilient parsing + optional clarifying retry
  const tryParseJson = (text: string): Record<string, unknown> | null => {
    if (!text) return null;
    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // JSON parse failed, try alternative method
    }

    // extract first JSON-looking object
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      let candidate = objMatch[0];
      candidate = candidate.replace(/,\s*(}|\])/g, "$1");
      try {
        return JSON.parse(candidate);
      } catch {
        // Parse attempt failed
      }
    }

    // best-effort: parse simple key: value lines
    const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const approx: Record<string, unknown> = {};
    for (const line of lines) {
      const kv = line.split(/:\s*/);
      if (kv.length >= 2) {
        const key = kv[0].replace(/^[-\s"]+|[\s".]+ $/g, "");
        let val = kv.slice(1).join(": ").trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        const num = Number(val);
        approx[key] = Number.isNaN(num) ? val : num;
      }
    }
    if (Object.keys(approx).length > 0) return approx;
    return null;
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();

      const parsed = tryParseJson(raw);
      if (parsed) {
        return {
          score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
          reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
        };
      }

      // try one clarifying retry if first attempt failed to produce clean JSON
      if (attempt === 1) {
        const clarifying = `${prompt}\n\nPlease respond with ONLY the exact JSON object and nothing else.`;
        const retryRes = await model.generateContent(clarifying);
        const retryRaw = retryRes.response.text();
        const parsed2 = tryParseJson(retryRaw);
        if (parsed2) {
          return {
            score: Math.min(100, Math.max(0, Number(parsed2.score) || 0)),
            reasons: Array.isArray(parsed2.reasons) ? parsed2.reasons : [],
          };
        }
      }

      throw new Error("AI returned invalid JSON. Please try again.");
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const status = (error && typeof error === 'object' && ('status' in error || 'httpStatusCode' in error)) 
        ? ((error as Record<string, unknown>).status || (error as Record<string, unknown>).httpStatusCode) 
        : undefined;
      const message = (error && typeof error === 'object' && 'message' in error) ? String((error as Record<string, unknown>).message).toLowerCase() : "";

      if (status === 429 || message.includes("quota") || message.includes("rate limit")) {
        const waitMs = attempt * 3000;
        console.warn(`Gemini rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/3)...`);
        await sleep(waitMs);
        continue;
      }

      if (typeof status === 'number' && status >= 500) {
        await sleep(attempt * 2000);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}