import { NextResponse } from 'next/server';
import { getServerQuizState, updateServerQuizState } from '@/lib/quizSync';
import { QuizState } from '@/types/quiz';


export async function GET() {
  const state = getServerQuizState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const payload: QuizState = await request.json();
    const updated = updateServerQuizState({
      type: 'STATE_SYNC',
      payload,
    });
    return NextResponse.json({ success: true, state: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update state';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
