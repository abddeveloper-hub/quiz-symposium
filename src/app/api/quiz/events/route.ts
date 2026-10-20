import { quizClients, getServerQuizState } from '@/lib/quizSync';


export async function GET(request: Request) {
  let clientWriter: ((data: string) => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      clientWriter = (data: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch {
          // Stream closed
        }
      };

      quizClients.add(clientWriter);

      // Immediately send authoritative current server state to newly connected client
      try {
        const currentState = getServerQuizState();
        const initialSyncPayload = `data: ${JSON.stringify({
          type: 'STATE_SYNC',
          payload: currentState,
        })}\n\n`;
        clientWriter(initialSyncPayload);
      } catch (e) {
        console.warn('Failed to send initial SSE state:', e);
      }

      // Heartbeat every 15s to keep mobile connection alive (prevents mobile sleep)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'));
        } catch {
          clearInterval(heartbeat);
          if (clientWriter) quizClients.delete(clientWriter);
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        if (clientWriter) quizClients.delete(clientWriter);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
}
