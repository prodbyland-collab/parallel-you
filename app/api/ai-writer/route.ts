import { NextResponse } from "next/server";
import { callAIWriter } from "@/lib/ai-writer";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { prompt?: string };
    if (!body.prompt || body.prompt.length > 12000) {
      return NextResponse.json({ text: null }, { status: 400 });
    }

    const text = await callAIWriter(body.prompt);
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json({ text: null }, { status: 200 });
  }
}
