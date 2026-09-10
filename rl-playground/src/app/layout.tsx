import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'RL Playground · 强化学习交互实验台',
  description: '在浏览器中探索六种经典强化学习算法：单步观察、价值热力图、策略对比与中文教学。',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
