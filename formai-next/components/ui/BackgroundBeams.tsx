"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] bg-opacity-20",
                className
            )}
        >
            <div className="absolute inset-x-0 top-0 h-full w-full bg-transparent overflow-hidden pointer-events-none [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]">
                <div className="absolute h-full w-full [mask-image:radial-gradient(100%_50%_at_top_center,white,transparent)] bg-page">
                    {/* Animated Beams */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent h-[2px] w-3/4 blur-sm top-0 left-1/4 animate-beam-horizontal" style={{ animationDuration: '7s' }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent h-[2px] w-1/2 blur-sm top-1/3 left-0 animate-beam-horizontal" style={{ animationDuration: '10s', animationDelay: '2s' }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/5 to-transparent h-[1px] w-full blur-sm top-2/3 left-[-20%] animate-beam-horizontal" style={{ animationDuration: '15s', animationDelay: '5s' }} />

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent w-[2px] h-3/4 blur-sm left-1/4 top-0 animate-beam-vertical" style={{ animationDuration: '8s' }} />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/5 to-transparent w-[1px] h-full blur-sm left-2/3 top-[-20%] animate-beam-vertical" style={{ animationDuration: '12s', animationDelay: '4s' }} />
                </div>
            </div>
        </div>
    );
};
