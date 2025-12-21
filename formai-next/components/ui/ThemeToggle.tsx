'use client';

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative p-2 rounded-full transition-colors ${
                theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/20 text-yellow-400'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } ${className}`}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </motion.div>
        </button>
    );
}

// Alternative switch style toggle
export function ThemeSwitch({ className = '' }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${
                isDark ? 'bg-primary/30' : 'bg-gray-300'
            } ${className}`}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            <motion.div
                className={`absolute top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-primary' : 'bg-white shadow-md'
                }`}
                initial={false}
                animate={{ x: isDark ? 28 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                {isDark ? (
                    <Moon className="w-3 h-3 text-black" />
                ) : (
                    <Sun className="w-3 h-3 text-yellow-500" />
                )}
            </motion.div>
        </button>
    );
}
