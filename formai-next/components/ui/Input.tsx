import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
        <input
            className={cn(
                "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none",
                className
            )}
            {...props}
        />
    </div>
);
