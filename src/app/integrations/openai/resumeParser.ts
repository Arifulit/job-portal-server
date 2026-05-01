
// // // import OpenAI from "openai";

// // // const openai = new OpenAI({
// // //   apiKey: process.env.GEMINI_API_KEY,
// // // });
// // // import { extractTextFromPdf } from "./pdfUtil";

// // // export async function analyzeResumeWithOpenAI(resumeFilePath: string) {
// // //   // Extract text from PDF
// // //   const resumeText = await extractTextFromPdf(resumeFilePath);
// // //   // You can customize the prompt as needed
// // //   const prompt = `Analyze the following resume text. Extract:
// // // Skills
// // // Score out of 100 (score)
// // // Suggest missing skills for a backend engineer
// // // Give improvement suggestions

// // // Resume:
// // // ${resumeText}

// // // Return JSON with keys: score, skills (array), missingSkills (array), suggestions (array).`;

// // //   const completion = await openai.chat.completions.create({
// // //     model: "gpt-3.5-turbo",
// // //     messages: [
// // //       { role: "system", content: "You are a helpful resume analyzer." },
// // //       { role: "user", content: prompt },
// // //     ],
// // //     temperature: 0.2,
// // //     max_tokens: 500,
// // //   });

// // //   const text = completion.choices[0]?.message?.content || "";
// // //   try {
// // //     const result = JSON.parse(text);
// // //     return result;
// // //   } catch {
// // //     return {
// // //       score: null,
// // //       skills: [],
// // //       missingSkills: [],
// // //       suggestions: [text],
// // //     };
// // //   }
// // // }


// // // integrations/openai/resumeParser.ts
// // import { getOpenAIClient } from "./index";

// // // ─── PDF text extraction ──────────────────────────────────────────
// // async function getPdfParser(): Promise<any> {
// //   try {
// //     return require("pdf-parse");
// //   } catch {
// //     return (await import("pdf-parse")).default;
// //   }
// // }

// // export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
// //   const pdfParse = await getPdfParser();
// //   const data = await pdfParse(buffer);
// //   return data.text?.trim() || "";
// // }

// // async function extractText(buffer: Buffer, mimetype?: string): Promise<string> {
// //   const type = (mimetype || "").toLowerCase();
// //   if (type.includes("pdf") || type === "application/pdf") {
// //     return extractTextFromPdf(buffer);
// //   }
// //   // plain text fallback
// //   return buffer.toString("utf-8").trim();
// // }

// // // ─── OpenAI analysis ──────────────────────────────────────────────
// // const SYSTEM_PROMPT = `You are an expert resume analyst. Analyze the resume and return ONLY a JSON object with this exact structure (no markdown):
// // {
// //   "score": <number 0-100>,
// //   "scoreBreakdown": {
// //     "formatting": <number 0-20>,
// //     "skills": <number 0-25>,
// //     "experience": <number 0-25>,
// //     "education": <number 0-15>,
// //     "completeness": <number 0-15>
// //   },
// //   "extractedSkills": [<string>],
// //   "missingSkills": [<string>],
// //   "strengths": [<string>],
// //   "suggestions": [<string>],
// //   "summary": "<string>"
// // }`;

// // export async function analyzeResumeWithOpenAI(
// //   filePath?: string,
// //   fileBuffer?: Buffer,
// //   mimetype?: string
// // ): Promise<{
// //   score: number;
// //   scoreBreakdown: Record<string, number>;
// //   extractedSkills: string[];
// //   missingSkills: string[];
// //   strengths: string[];
// //   suggestions: string[];
// //   summary: string;
// // }> {
// //   // 1. Buffer resolve করো
// //   let buffer: Buffer;

// //   if (fileBuffer && fileBuffer.length > 0) {
// //     buffer = fileBuffer;
// //   } else if (filePath) {
// //     const fs = await import("fs/promises");
// //     buffer = await fs.readFile(filePath);
// //   } else {
// //     throw new Error("Either fileBuffer or filePath must be provided");
// //   }

// //   // 2. Text extract
// //   const resumeText = await extractText(buffer, mimetype);

// //   if (!resumeText || resumeText.length < 50) {
// //     throw new Error(
// //       "Could not extract readable text from the resume. Please upload a text-based PDF."
// //     );
// //   }

// //   // 3. OpenAI call
// //   const openai = getOpenAIClient();

// //   const completion = await openai.chat.completions.create({
// //     model: "gpt-3.5-turbo",
// //     messages: [
// //       { role: "system", content: SYSTEM_PROMPT },
// //       { role: "user", content: `Analyze this resume:\n\n${resumeText.slice(0, 6000)}` },
// //     ],
// //     temperature: 0.2,
// //     max_tokens: 1000,
// //     response_format: { type: "json_object" },
// //   });

// //   const raw = completion.choices?.[0]?.message?.content || "{}";

// //   // 4. Parse + normalize
// //   let parsed: any;
// //   try {
// //     parsed = JSON.parse(raw);
// //   } catch {
// //     throw new Error("AI returned invalid JSON. Please try again.");
// //   }

// //   return {
// //     score: Number(parsed.score) || 0,
// //     scoreBreakdown: parsed.scoreBreakdown || {},
// //     extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
// //     missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
// //     strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
// //     suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
// //     summary: parsed.summary || "",
// //   };
// // }

// // integrations/openai/resumeParser.ts
// import OpenAI from "openai";

// // ─── PDF text extraction ──────────────────────────────────────────
// async function getPdfParser(): Promise<any> {
//   try {
//     return require("pdf-parse");
//   } catch {
//     return (await import("pdf-parse")).default;
//   }
// }

// export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
//   const pdfParse = await getPdfParser();
//   const data = await pdfParse(buffer);
//   return data.text?.trim() || "";
// }

// async function extractText(buffer: Buffer, mimetype?: string): Promise<string> {
//   const type = (mimetype || "").toLowerCase();
//   if (type.includes("pdf") || type === "application/pdf") {
//     return extractTextFromPdf(buffer);
//   }
//   return buffer.toString("utf-8").trim();
// }

// // ─── OpenAI client ────────────────────────────────────────────────
// function getOpenAIClient(): OpenAI {
//   const apiKey = process.env.GEMINI_API_KEY;
//   if (!apiKey) {
//     throw new Error("GEMINI_API_KEY environment variable is not set");
//   }
//   return new OpenAI({ apiKey });
// }

// // ─── Prompt ───────────────────────────────────────────────────────
// const SYSTEM_PROMPT = `You are an expert resume analyst. Analyze the resume and return ONLY a JSON object with this exact structure (no markdown, no extra text):
// {
//   "score": <number 0-100>,
//   "scoreBreakdown": {
//     "formatting": <number 0-20>,
//     "skills": <number 0-25>,
//     "experience": <number 0-25>,
//     "education": <number 0-15>,
//     "completeness": <number 0-15>
//   },
//   "extractedSkills": [<string>],
//   "missingSkills": [<string>],
//   "strengths": [<string>],
//   "suggestions": [<string>],
//   "summary": "<string>"
// }`;

// // ─── Retry helper ─────────────────────────────────────────────────
// async function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function callOpenAIWithRetry(
//   openai: OpenAI,
//   resumeText: string,
//   maxRetries = 3
// ): Promise<string> {
//   let lastError: any;

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       const completion = await openai.chat.completions.create({
//         model: "gpt-3.5-turbo",
//         messages: [
//           { role: "system", content: SYSTEM_PROMPT },
//           {
//             role: "user",
//             content: `Analyze this resume:\n\n${resumeText.slice(0, 6000)}`,
//           },
//         ],
//         temperature: 0.2,
//         max_tokens: 1000,
//         response_format: { type: "json_object" },
//       });

//       return completion.choices?.[0]?.message?.content || "{}";
//     } catch (error: any) {
//       lastError = error;

//       const status = error?.status || error?.response?.status;
//       const code = error?.code || error?.error?.code;

//       // ── 429: quota exhausted vs rate limited ──
//       if (status === 429) {
//         const isQuotaExceeded =
//           code === "insufficient_quota" ||
//           (error?.message || "").includes("exceeded your current quota");

//         if (isQuotaExceeded) {
//           // Hard quota — retrying won't help at all
//           throw new Error(
//             "OpenAI quota exceeded. Please add credits at https://platform.openai.com/account/billing"
//           );
//         }

//         // Soft rate limit — wait and retry
//         const waitMs = attempt * 2000; // 2s → 4s → 6s
//         console.warn(
//           `OpenAI rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})...`
//         );
//         await sleep(waitMs);
//         continue;
//       }

//       // ── 5xx server errors → retry with backoff ──
//       if (status >= 500) {
//         const waitMs = attempt * 1500;
//         console.warn(`OpenAI server error ${status}. Retrying in ${waitMs}ms...`);
//         await sleep(waitMs);
//         continue;
//       }

//       // ── Other errors (400, 401, etc.) → fail immediately ──
//       throw error;
//     }
//   }

//   throw lastError;
// }

// // ─── Main analysis function ───────────────────────────────────────
// export async function analyzeResumeWithOpenAI(
//   filePath?: string,
//   fileBuffer?: Buffer,
//   mimetype?: string
// ): Promise<{
//   score: number;
//   scoreBreakdown: Record<string, number>;
//   extractedSkills: string[];
//   missingSkills: string[];
//   strengths: string[];
//   suggestions: string[];
//   summary: string;
// }> {
//   // 1. Resolve buffer
//   let buffer: Buffer;

//   if (fileBuffer && fileBuffer.length > 0) {
//     buffer = fileBuffer;
//   } else if (filePath) {
//     const fs = await import("fs/promises");
//     buffer = await fs.readFile(filePath);
//   } else {
//     throw new Error("Either fileBuffer or filePath must be provided");
//   }

//   // 2. Extract text
//   const resumeText = await extractText(buffer, mimetype);

//   if (!resumeText || resumeText.length < 50) {
//     throw new Error(
//       "Could not extract readable text from the resume. Please upload a text-based PDF."
//     );
//   }

//   // 3. Call OpenAI with retry logic
//   const openai = getOpenAIClient();
//   const raw = await callOpenAIWithRetry(openai, resumeText);

//   // 4. Strip markdown fences just in case, then parse
//   const cleaned = raw.replace(/```json|```/g, "").trim();

//   let parsed: any;
//   try {
//     parsed = JSON.parse(cleaned);
//   } catch {
//     throw new Error("AI returned invalid JSON. Please try again.");
//   }

//   return {
//     score: Number(parsed.score) || 0,
//     scoreBreakdown: parsed.scoreBreakdown || {},
//     extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
//     missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
//     strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
//     suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
//     summary: parsed.summary || "",
//   };
// }


// integrations/gemini/resumeParser.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── PDF text extraction ──────────────────────────────────────────
async function getPdfParser(): Promise<any> {
  try {
    return require("pdf-parse");
  } catch {
    return (await import("pdf-parse")).default;
  }
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = await getPdfParser();
  const data = await pdfParse(buffer);
  return data.text?.trim() || "";
}

async function extractText(buffer: Buffer, mimetype?: string): Promise<string> {
  const type = (mimetype || "").toLowerCase();
  if (type.includes("pdf") || type === "application/pdf") {
    return extractTextFromPdf(buffer);
  }
  return buffer.toString("utf-8").trim();
}

// ─── Gemini client ────────────────────────────────────────────────
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

// ─── Prompt ───────────────────────────────────────────────────────
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

// ─── Retry helper ─────────────────────────────────────────────────
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiWithRetry(
  resumeText: string,
  maxRetries = 3
): Promise<string> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1000,
      responseMimeType: "application/json", // force JSON output
    },
  });

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = `${SYSTEM_PROMPT}\n\nAnalyze this resume:\n\n${resumeText.slice(0, 6000)}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } catch (error: any) {
      lastError = error;

      const status = error?.status || error?.httpStatusCode;
      const message = (error?.message || "").toLowerCase();

      // 429 rate limit → wait and retry
      if (status === 429 || message.includes("quota") || message.includes("rate limit")) {
        const waitMs = attempt * 3000; // 3s → 6s → 9s
        console.warn(
          `Gemini rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/${maxRetries})...`
        );
        await sleep(waitMs);
        continue;
      }

      // 5xx server errors → retry with backoff
      if (status >= 500) {
        const waitMs = attempt * 2000;
        console.warn(`Gemini server error ${status}. Retrying in ${waitMs}ms...`);
        await sleep(waitMs);
        continue;
      }

      // Other errors → fail immediately
      throw error;
    }
  }

  throw lastError;
}

// ─── Main analysis function ───────────────────────────────────────
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
  // 1. Resolve buffer
  let buffer: Buffer;

  if (fileBuffer && fileBuffer.length > 0) {
    buffer = fileBuffer;
  } else if (filePath) {
    const fs = await import("fs/promises");
    buffer = await fs.readFile(filePath);
  } else {
    throw new Error("Either fileBuffer or filePath must be provided");
  }

  // 2. Extract text
  const resumeText = await extractText(buffer, mimetype);

  if (!resumeText || resumeText.length < 50) {
    throw new Error(
      "Could not extract readable text from the resume. Please upload a text-based PDF."
    );
  }

  // 3. Call Gemini with retry logic
  const raw = await callGeminiWithRetry(resumeText);

  // 4. Strip markdown fences just in case, then parse
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  return {
    score: Number(parsed.score) || 0,
    scoreBreakdown: parsed.scoreBreakdown || {},
    extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
    missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    summary: parsed.summary || "",
  };
}

export const analyzeResumeWithOpenAI = analyzeResumeWithGemini;