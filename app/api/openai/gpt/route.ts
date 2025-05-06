import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  const { prompt } = await request.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // 또는 'gpt-3.5-turbo'
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content ?? '';

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({
      error: 'Error generating text from OpenAI',
      message: err?.message || 'Unknown error',
    }, { status: 500 });
  }
}