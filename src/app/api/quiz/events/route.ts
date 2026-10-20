import { quizClients } from '@/lib/quizSync';

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

      // Initial connection ping
      clientWriter(': connected\n\n');

      // Heartbeat every 15s to keep mobile connection alive
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
    },
  });
}
