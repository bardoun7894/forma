'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    gradient?: string;
    animate?: boolean;
}

export function GradientText({
    children,
    className = '',
    gradient = 'from-primary via-cyan-400 to-blue-500',
    animate = true,
}: GradientTextProps) {
    return (
        <motion.span
            initial={animate ? { opacity: 0, y: 20 } : {}}
            animate={animate ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={cn(
                'bg-gradient-to-r bg-clip-text text-transparent',
                gradient,
                className
            )}
        >
            {children}
        </motion.span>
    );
}

interface TypewriterTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export function TypewriterText({ text, className = '', delay = 0 }: TypewriterTextProps) {
    const words = text.split(' ');

    return (
        <span className={className}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.3,
                        delay: delay + i * 0.1,
                        ease: 'easeOut',
                    }}
                    className="inline-block mr-[0.25em]"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
}
