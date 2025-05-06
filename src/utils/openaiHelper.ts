import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const generateText = async (prompt: string) => {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 150,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error generating text from OpenAI:", error);
    throw new Error("Failed to generate text");
  }
};

export const formatPrompt = (input: string) => {
  return `You are a helpful assistant. ${input}`;
};