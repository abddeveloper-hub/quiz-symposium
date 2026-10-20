import { updateServerQuizState } from '@/lib/quizSync';
import { QuizAction } from '@/types/quiz';


export async function POST(request: Request) {
  try {
    const action: QuizAction = await request.json();
    const updatedState = updateServerQuizState(action);
    return Response.json({ success: true, status: updatedState.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to process quiz action';
    return Response.json({ error: message }, { status: 400 });
  }
}
