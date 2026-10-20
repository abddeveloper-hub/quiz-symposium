import type { Metadata } from 'next';
import { Noto_Serif, Manrope } from 'next/font/google';
import './globals.css';
import { QuizProvider } from '@/context/QuizStateContext';

const notoSerif = Noto_Serif({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Luminous Emerald Academic | Symposium Quiz Platform',
  description:
    'Scholarly real-time symposium quiz platform with dedicated Admin Control Room and high-precision Participant Arena.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSerif.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#e8fef8] text-[#0c1f1b] selection:bg-[#7cf8d7] selection:text-[#003328] font-sans">
        <QuizProvider>{children}</QuizProvider>
      </body>
    </html>
  );
}
