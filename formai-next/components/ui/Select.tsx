"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="w-full">
            {label && <label className={cn("block text-sm font-medium mb-1.5", isDark ? "text-gray-400" : "text-gray-600")}>{label}</label>}
            <div className="relative">
                <select
                    className={cn(
                        "w-full appearance-none rounded-lg px-4 py-3 transition-colors focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none pr-10 border",
                        isDark
                            ? "bg-white/5 border-white/10 text-white"
                            : "bg-white border-gray-300 text-gray-900",
                        className
                    )}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className={isDark ? "bg-[#1a1a1a] text-white" : "bg-white text-gray-900"}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none", isDark ? "text-gray-500" : "text-gray-400")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
            </div>
        </div>
    );
};
