import { broadcastQuizAction } from '@/lib/quizSync';

export async function POST(request: Request) {
  try {
    const action = await request.json();
    broadcastQuizAction(action);
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process quiz action';
    return Response.json({ error: message }, { status: 400 });
  }
}
