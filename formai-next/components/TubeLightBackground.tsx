"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function TubeLightBackground({ className }: { className?: string }) {
    // Static mesh nodes (same for server and client)
    const meshNodes = [
        { x: "10%", y: "20%", color: "primary" },
        { x: "25%", y: "40%", color: "purple" },
        { x: "40%", y: "15%", color: "blue" },
        { x: "60%", y: "30%", color: "cyan" },
        { x: "75%", y: "50%", color: "pink" },
        { x: "90%", y: "25%", color: "primary" },
        { x: "15%", y: "70%", color: "blue" },
        { x: "35%", y: "85%", color: "purple" },
        { x: "55%", y: "75%", color: "cyan" },
        { x: "80%", y: "90%", color: "pink" },
        { x: "50%", y: "60%", color: "primary" },
    ];

    const colorClass = {
        primary: "bg-primary",
        purple: "bg-purple-500",
        blue: "bg-blue-500",
        cyan: "bg-cyan-500",
        pink: "bg-pink-500",
    };

    // Static connections
    const connections = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [0, 6],
        [6, 7],
        [7, 8],
        [8, 9],
        [5, 9],
        [1, 7],
        [2, 8],
        [3, 9],
        [10, 0],
        [10, 5],
    ];

    // Static floating particles (deterministic for hydration)
    const staticParticles = Array.from({ length: 20 }).map((_, i) => ({
        left: `${(i * 5) % 100}%`,
        top: `${(i * 7) % 100}%`,
        xOffset: (i % 3) * 20 - 20, // deterministic offsets for animation
        yOffset: (i % 5) * 15 - 30,
        duration: 3 + (i % 4),
        delay: i * 0.3,
    }));

    return (
        <div className={cn("absolute inset-0 overflow-hidden bg-[#070707]", className)}>
            {/* Ambient background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-black via-[#070707] to-black opacity-90" />

            {/* Mesh Connections SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {connections.map(([from, to], idx) => {
                    const nodeA = meshNodes[from];
                    const nodeB = meshNodes[to];
                    const x1 = parseFloat(nodeA.x);
                    const y1 = parseFloat(nodeA.y);
                    const x2 = parseFloat(nodeB.x);
                    const y2 = parseFloat(nodeB.y);
                    return (
                        <motion.line
                            key={`conn-${idx}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="url(#gradient)"
                            strokeWidth="0.5"
                            strokeOpacity="0.4"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: [0, 1, 0], opacity: [0, 0.6, 0] }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse",
                                delay: idx * 0.1,
                            }}
                        />
                    );
                })}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00C4CC" />
                        <stop offset="50%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Mesh Nodes */}
            {meshNodes.map((node, idx) => (
                <motion.div
                    key={`node-${idx}`}
                    className={`absolute w-2 h-2 rounded-full ${colorClass[node.color as keyof typeof colorClass]} shadow-lg`}
                    style={{ left: node.x, top: node.y }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.7] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: idx * 0.2,
                    }}
                />
            ))}

            {/* Tube Lights (original enhanced) */}
            <div className="absolute inset-0 flex justify-center">
                {/* Light 1 - Center Primary */}
                <motion.div
                    initial={{ opacity: 0, height: "0%" }}
                    animate={{ opacity: [0, 0.5, 0.2], height: ["0%", "70%", "60%"] }}
                    transition={{ duration: 3, ease: "easeOut", repeat: Infinity, repeatType: "reverse" }}
                    className="absolute top-0 w-[1px] bg-gradient-to-b from-primary/0 via-primary/80 to-primary/0 blur-[2px]"
                    style={{ left: "50%" }}
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.3, 0] }}
                    transition={{ duration: 3, ease: "easeOut", repeat: Infinity, repeatType: "reverse", delay: 0.1 }}
                    className="absolute top-0 w-[60px] h-[60%] bg-gradient-to-b from-primary/0 via-primary/10 to-primary/0 blur-[40px]"
                    style={{ left: "50%", transform: "translateX(-50%)" }}
                />

                {/* Light 2 - Left Purple */}
                <motion.div
                    initial={{ opacity: 0, height: "0%" }}
                    animate={{ opacity: [0, 0.4, 0.1], height: ["0%", "50%", "40%"] }}
                    transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1 }}
                    className="absolute top-0 w-[1px] bg-gradient-to-b from-purple-500/0 via-purple-500/60 to-purple-500/0 blur-[2px]"
                    style={{ left: "30%" }}
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1.1 }}
                    className="absolute top-0 w-[50px] h-[50%] bg-gradient-to-b from-purple-500/0 via-purple-500/10 to-purple-500/0 blur-[30px]"
                    style={{ left: "30%", transform: "translateX(-50%)" }}
                />

                {/* Light 3 - Right Blue */}
                <motion.div
                    initial={{ opacity: 0, height: "0%" }}
                    animate={{ opacity: [0, 0.4, 0.1], height: ["0%", "55%", "45%"] }}
                    transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 0.5 }}
                    className="absolute top-0 w-[1px] bg-gradient-to-b from-blue-500/0 via-blue-500/60 to-blue-500/0 blur-[2px]"
                    style={{ left: "70%" }}
                />
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.2, 0] }}
                    transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 0.6 }}
                    className="absolute top-0 w-[50px] h-[55%] bg-gradient-to-b from-blue-500/0 via-blue-500/10 to-blue-500/0 blur-[30px]"
                    style={{ left: "70%", transform: "translateX(-50%)" }}
                />

                {/* Light 4 - Far Left Cyan */}
                <motion.div
                    initial={{ opacity: 0, height: "0%" }}
                    animate={{ opacity: [0, 0.3, 0.1], height: ["0%", "40%", "30%"] }}
                    transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 2 }}
                    className="absolute top-0 w-[1px] bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 blur-[2px]"
                    style={{ left: "15%" }}
                />

                {/* Light 5 - Far Right Pink */}
                <motion.div
                    initial={{ opacity: 0, height: "0%" }}
                    animate={{ opacity: [0, 0.3, 0.1], height: ["0%", "45%", "35%"] }}
                    transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", delay: 1.5 }}
                    className="absolute top-0 w-[1px] bg-gradient-to-b from-pink-500/0 via-pink-500/50 to-pink-500/0 blur-[2px]"
                    style={{ left: "85%" }}
                />
            </div>

            {/* Floating Particles */}
            {staticParticles.map((p, i) => (
                <motion.div
                    key={`particle-${i}`}
                    className="absolute w-[1px] h-[1px] bg-primary rounded-full"
                    style={{ left: p.left, top: p.top }}
                    initial={{ opacity: 0 }}
                    animate={{
                        x: [0, p.xOffset],
                        y: [0, p.yOffset],
                        opacity: [0, 0.8, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: p.delay,
                    }}
                />
            ))}

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>
    );
}