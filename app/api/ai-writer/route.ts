import { NextResponse } from "next/server";
import { callAIWriter } from "@/lib/ai-writer";

const MAX_PROMPT_LENGTH = 60000;

function getProvider() {
  return (process.env.AI_PROVIDER || (process.env.AI_API_KEY || process.env.OPENAI_API_KEY ? "openai" : "none")).toLowerCase();
}

function getModel() {
  return process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
}

function hasApiKey() {
  return Boolean(process.env.AI_API_KEY || process.env.OPENAI_API_KEY);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: getProvider(),
    model: getModel(),
    hasApiKey: hasApiKey(),
    maxPromptLength: MAX_PROMPT_LENGTH
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { prompt?: string } | null;
    const prompt = body?.prompt;

    if (!prompt) {
      return NextResponse.json({ text: null, error: "Missing prompt" }, { status: 400 });
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({
        text: null,
        error: "Prompt too long",
        promptLength: prompt.length,
        maxPromptLength: MAX_PROMPT_LENGTH
      }, { status: 413 });
    }

    if (!hasApiKey()) {
      return NextResponse.json({
        text: null,
        error: "Missing AI API key on server",
        provider: getProvider(),
        model: getModel()
      }, { status: 500 });
    }

    const text = await callAIWriter(prompt);
    if (!text) {
      return NextResponse.json({
        text: null,
        error: "AI returned no text",
        provider: getProvider(),
        model: getModel()
      }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("/api/ai-writer failed", error);
    return NextResponse.json({
      text: null,
      error: "AI writer route failed",
      detail: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
