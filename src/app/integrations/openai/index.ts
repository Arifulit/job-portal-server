import OpenAI from "openai";
import { env } from "../../config/env";

export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Generate a text-embedding-3-small vector for the given text.
 * Text is truncated to 8 000 chars to stay well within token limits.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}
