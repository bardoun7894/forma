import React from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
        <div className="relative">
            <select
                className={cn(
                    "w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white transition-colors focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none pr-10",
                    className
                )}
                {...props}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#1a1a1a] text-white">
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
        </div>
    </div>
);
