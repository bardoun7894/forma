"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className, ...props }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="w-full">
            {label && <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-gray-400" : "text-gray-600")}>{label}</label>}
            <textarea
                className={cn(
                    "w-full rounded-lg px-4 py-3 transition-colors focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none border",
                    isDark
                        ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                        : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
                    className
                )}
                {...props}
            />
        </div>
    );
};
