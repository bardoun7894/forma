import React from "react";
import { cn } from "@/lib/utils";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className, ...props }) => (
    <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-400 mb-1.5">{label}</label>}
        <textarea
            className={cn(
                "w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none",
                className
            )}
            {...props}
        />
    </div>
);
