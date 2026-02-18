import { NextResponse } from 'next/server';
import { SarvamAIClient } from 'sarvamai';
import { ModelMessage, generateText, stepCountIs, tool } from "ai";
import { groq } from '@ai-sdk/groq';
import z from 'zod';
import { auth } from "@/lib/auth";
import { client as dbClient } from '@/db';
import { headers } from 'next/headers';
import { redis } from '@/lib/redis';

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY!,
});

const HISTORY_TTL = 60 * 60; // 1 hour
const MAX_HISTORY = 20; // Keep last 20 messages for context

function redisKey(userId: string, conversationId: string) {
  return `voice-history:${userId}:${conversationId}`;
}

export const executeSql = tool({
  description: 'Execute a read-only SQL query against the PostgreSQL database. Use this to fetch data from the user, inventory, listings, and orders tables. Always quote the table name "user" since it is a reserved keyword.',
  inputSchema: z.object({
    query: z.string().describe('The SQL SELECT query to execute'),
  }),
  execute: async ({ query }) => {
    const result = await dbClient.unsafe(query);
    return { success: true, rows: result, rowCount: result.length };
  },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob;
    const session = await auth.api.getSession({ headers: await headers() });

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = (formData.get('conversationId') as string) ?? crypto.randomUUID();
    const key = redisKey(userId, conversationId);

    // Fetch conversation history from Redis
    const storedHistory = await redis.get<ModelMessage[]>(key) ?? [];

    const buffer = Buffer.from(await file.arrayBuffer());
    const audioFile = new File([buffer], 'recording.wav', { type: 'audio/wav' });

    const response = await client.speechToText.transcribe({
      file: audioFile,
      model: 'saaras:v3',
      mode: 'translate',
    });

    // Build messages array: history + new user message
    const messages: ModelMessage[] = [
      ...storedHistory,
      { role: 'user' as const, content: response.transcript },
    ];

    const { text } = await generateText({
      model: groq('openai/gpt-oss-120b'),
      system: `You are AgroStack Assistant, an agricultural voice assistant for Indian farmers.

## Current User
The logged-in user's ID is: ${userId}
Use this to scope queries to the current user (e.g., WHERE user_id = '${userId}') when they ask about "my" data.

## Tool: executeSql
You have access to \`executeSql\` — it runs a SQL query against the app's PostgreSQL database and returns the result rows.
- ALWAYS call executeSql for any data-related question (inventory, orders, listings, users). Never refuse or say you can't access data.
- To discover tables and columns, run: SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public';
- Always double-quote the table name "user" — it is a reserved keyword in PostgreSQL.
- You can call the tool multiple times in sequence (e.g., first discover schema, then query data).
- Use only SELECT queries unless the user explicitly asks to modify data.

## Response Guidelines
- Answer ONLY what the user asked. Do not add extra information, or follow-ups.
- No bullet points, lists, or markdown formatting — output plain spoken text.
- Respond in English — translation to Malayalam happens automatically.`,
      messages,
      tools: { executeSql },
      stopWhen: stepCountIs(15),
    });

    console.log(text);

    // Save updated history to Redis (keep last N messages, reset TTL)
    const updatedHistory: ModelMessage[] = [
      ...storedHistory,
      { role: 'user' as const, content: response.transcript },
      { role: 'assistant' as const, content: text },
    ].slice(-MAX_HISTORY);

    await redis.set(key, updatedHistory, { ex: HISTORY_TTL });

    const language = 'ml-IN';

    const translation = await client.text.translate({
      input: text,
      source_language_code: 'auto',
      target_language_code: language,
    });

    const speaker = 'priya';

    const audioResponse = await client.textToSpeech.convert({
      text: translation.translated_text,
      target_language_code: language,
      speaker,
      model: 'bulbul:v3',
    });

    const audioBase64 = audioResponse.audios[0];

    if (!audioBase64) {
      return NextResponse.json({ error: 'TTS returned no audio' }, { status: 500 });
    }

    return NextResponse.json({
      transcript: response.transcript,
      languageCode: response.language_code,
      response: text,
      audio: audioBase64
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Speech-to-text failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}