import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || '',
});

export async function POST(request: Request) {
  const { prompt } = await request.json();
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const completion = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = completion.content
      .filter((block: any) => block.type === 'text' && typeof block.text === 'string')
      .map((block: any) => block.text)
      .join('\n');

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({
      error: 'Error generating text from Claude',
      message: err?.message || 'Unknown error',
    }, { status: 500 });
  }
}
