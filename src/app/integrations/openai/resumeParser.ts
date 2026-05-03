import { GoogleGenerativeAI } from "@google/generative-ai";

// Robust dynamic loader for pdf-parse to handle different export shapes
async function getPdfParser(): Promise<(buffer: Buffer) => Promise<{ text: string }>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import("pdf-parse");

    if (typeof mod === "function") return mod as any;
    if (mod && typeof mod.default === "function") return mod.default as any;

    // Fallback: find first exported function
    for (const key of Object.keys(mod)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val: any = mod[key];
      if (typeof val === "function") return val as any;
    }

    throw new Error("pdf-parse did not export a callable function");
  } catch (err) {
    throw new Error("pdf-parse module not found or failed to load");
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = await getPdfParser();
  const data = await pdfParse(buffer);
  return data?.text?.toString().trim() || "";
}

async function extractText(buffer: Buffer, mimetype?: string): Promise<string> {
  const type = (mimetype || "").toLowerCase();
  if (type.includes("pdf") || type === "application/pdf") {
    return extractTextFromPdf(buffer);
  }
  return buffer.toString("utf-8").trim();
}

// Gemini client helper
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  return new GoogleGenerativeAI(apiKey);
}

const SYSTEM_PROMPT = `You are an expert resume analyst. Analyze the resume and return ONLY a JSON object with this exact structure (no markdown, no extra text, no backticks):
{
  "score": <number 0-100>,
  "scoreBreakdown": {
    "formatting": <number 0-20>,
    "skills": <number 0-25>,
    "experience": <number 0-25>,
    "education": <number 0-15>,
    "completeness": <number 0-15>
  },
  "extractedSkills": [<string>],
  "missingSkills": [<string>],
  "strengths": [<string>],
  "suggestions": [<string>],
  "summary": "<string>"
}`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(resumeText: string, maxRetries = 3): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
      responseMimeType: "application/json",
    },
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nAnalyze this resume:\n\n${resumeText.slice(0, 6000)}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errObj = error as Record<string, unknown>;
      const status = typeof errObj?.status === "number" ? errObj.status : typeof errObj?.httpStatusCode === "number" ? errObj.httpStatusCode : undefined;
      const message = typeof errObj?.message === "string" ? errObj.message.toLowerCase() : "";

      if (status === 429 || message.includes("quota") || message.includes("rate limit")) {
        const waitMs = attempt * 3000;
        console.warn(`Gemini rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})...`);
        await sleep(waitMs);
        continue;
      }

      if (typeof status === "number" && status >= 500) {
        const waitMs = attempt * 2000;
        console.warn(`Gemini server error ${status}. Retrying in ${waitMs}ms...`);
        await sleep(waitMs);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export async function analyzeResumeWithGemini(
  filePath?: string,
  fileBuffer?: Buffer,
  mimetype?: string
): Promise<{
  score: number;
  scoreBreakdown: Record<string, number>;
  extractedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  suggestions: string[];
  summary: string;
}> {
  let buffer: Buffer;

  if (fileBuffer && fileBuffer.length > 0) {
    buffer = fileBuffer;
  } else if (filePath) {
    const fs = await import("fs/promises");
    buffer = await fs.readFile(filePath);
  } else {
    throw new Error("Either fileBuffer or filePath must be provided");
  }

  const resumeText = await extractText(buffer, mimetype);

  if (!resumeText || resumeText.length < 50) {
    throw new Error("Could not extract readable text from the resume. Please upload a text-based PDF.");
  }

  const raw = await callGeminiWithRetry(resumeText);
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  return {
    score: Number(parsed.score) || 0,
    scoreBreakdown: typeof parsed.scoreBreakdown === "object" && parsed.scoreBreakdown !== null ? (parsed.scoreBreakdown as Record<string, number>) : {},
    extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills as string[] : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills as string[] : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths as string[] : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions as string[] : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
}

export const analyzeResumeWithOpenAI = analyzeResumeWithGemini;
