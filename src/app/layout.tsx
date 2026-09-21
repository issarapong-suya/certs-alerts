import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  subsets: ['latin', 'thai'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-prompt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบแจ้งเตือนใบประกาศนียบัตรบุคลากร | Personnel Certificate Alert System',
  description: 'ระบบจัดการและแจ้งเตือนวันหมดอายุใบประกาศนียบัตรบุคลากร (Next.js, Supabase, Tailwind CSS, Discord, Resend)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={prompt.variable}>
      <body className={`${prompt.className} antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
