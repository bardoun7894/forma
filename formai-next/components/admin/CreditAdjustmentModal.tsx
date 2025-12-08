"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CreditAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (amount: number, reason: string, type: 'add' | 'deduct') => void;
    userName: string;
    currentCredits: number;
    isLoading?: boolean;
}

export function CreditAdjustmentModal({
    isOpen,
    onClose,
    onSubmit,
    userName,
    currentCredits,
    isLoading = false,
}: CreditAdjustmentModalProps) {
    const t = useTranslations('admin');
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [type, setType] = useState<'add' | 'deduct'>('add');

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setReason('');
            setType('add');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseInt(amount, 10);
        if (isNaN(numAmount) || numAmount <= 0) return;
        onSubmit(numAmount, reason, type);
    };

    const previewCredits = type === 'add'
        ? currentCredits + (parseInt(amount, 10) || 0)
        : Math.max(0, currentCredits - (parseInt(amount, 10) || 0));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-page border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 rtl:right-auto rtl:left-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-2">{t('adjustCredits')}</h3>
                <p className="text-gray-400 mb-6">{userName}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Toggle */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setType('add')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${type === 'add'
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {t('addCredits')}
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('deduct')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${type === 'deduct'
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                }`}
                        >
                            {t('deductCredits')}
                        </button>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            {t('creditAmount')}
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
                            placeholder="100"
                            required
                        />
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            {t('creditReason')}
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors resize-none"
                            placeholder={t('creditReasonPlaceholder')}
                            required
                        />
                    </div>

                    {/* Preview */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">{t('currentCredits')}:</span>
                            <span className="text-white font-medium">{currentCredits}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                            <span className="text-gray-400">{t('change')}:</span>
                            <span className={type === 'add' ? 'text-green-400' : 'text-red-400'}>
                                {type === 'add' ? '+' : '-'}{amount || 0}
                            </span>
                        </div>
                        <div className="border-t border-white/10 mt-3 pt-3 flex justify-between">
                            <span className="text-gray-400">{t('newBalance')}:</span>
                            <span className="text-white font-bold">{previewCredits}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            variant={type === 'add' ? 'primary' : 'danger'}
                            isLoading={isLoading}
                            disabled={!amount || !reason}
                        >
                            {t('confirm')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
