// Shared server-side in-memory event bus for real-time LAN/Wi-Fi devices

type SSEWriter = (data: string) => void;

// Global singleton across hot reloads in Next.js development
const globalForQuiz = global as unknown as {
  quizClients: Set<SSEWriter>;
  lastStatePayload: string | null;
};

if (!globalForQuiz.quizClients) {
  globalForQuiz.quizClients = new Set();
}

export const quizClients = globalForQuiz.quizClients;

export function broadcastQuizAction(action: unknown) {
  const data = `data: ${JSON.stringify(action)}\n\n`;
  globalForQuiz.lastStatePayload = data;

  quizClients.forEach((send) => {
    try {
      send(data);
    } catch {
      quizClients.delete(send);
    }
  });
}
