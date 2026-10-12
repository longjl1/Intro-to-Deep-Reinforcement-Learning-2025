'use client';
import { MotionConfig } from 'motion/react';
import { TooltipProvider } from '@/components/animate-ui/primitives/radix/tooltip';

export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: 0.15 }}>
    <TooltipProvider delayDuration={350}>{children}</TooltipProvider>
  </MotionConfig>;
}
