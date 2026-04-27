import { OpenAIApi, Configuration } from "openai";

// You should set your OpenAI API key in your environment variables
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function analyzeResumeWithOpenAI(resumeText: string) {
  // You can customize the prompt as needed
  const prompt = `Analyze the following resume text. Extract:
- Skills
- Score out of 100 (score)
- Suggest missing skills for a backend engineer
- Give improvement suggestions

Resume:
${resumeText}

Return JSON with keys: score, skills (array), missingSkills (array), suggestions (array).`;

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a helpful resume analyzer." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 500,
  });

  // Try to parse the response as JSON
  const text = completion.data.choices[0].message?.content || "";
  try {
    const result = JSON.parse(text);
    return result;
  } catch {
    // If not valid JSON, return as suggestion
    return {
      score: null,
      skills: [],
      missingSkills: [],
      suggestions: [text],
    };
  }
}
