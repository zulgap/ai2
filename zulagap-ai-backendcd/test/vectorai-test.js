import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
async function createVectorStore() {
  const vectorStore = await openai.vectorStores.create({
    name: 'my-rag-store',
  });
  console.log('Vector Store ID:', vectorStore.id);
}
createVectorStore();