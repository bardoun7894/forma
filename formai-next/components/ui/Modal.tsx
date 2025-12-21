"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    children,
    className = "",
    showCloseButton = true
}: ModalProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            window.addEventListener("keydown", handleEscape);
        }

        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, onClose]);

    // Use portal if document is defined (client-side)
    if (typeof document === "undefined") return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] transition-all"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 w-full h-full pointer-events-none flex items-center justify-center z-[101] p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={cn(
                                "relative pointer-events-auto border rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl mx-auto",
                                isDark ? "bg-black border-white/10" : "bg-white border-gray-200",
                                className
                            )}
                        >
                            {/* Close Button */}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className={cn(
                                        "absolute top-4 right-4 z-10 p-2 rounded-full transition-colors border",
                                        isDark
                                            ? "bg-black/50 hover:bg-white/10 text-white/70 hover:text-white border-white/5"
                                            : "bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 border-gray-200"
                                    )}
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}

                            {children}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
