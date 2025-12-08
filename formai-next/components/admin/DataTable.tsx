"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Pagination } from "./Pagination";
import { Loader2 } from "lucide-react";

interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
    emptyMessage?: string;
    emptyIcon?: React.ReactNode;
}

export function DataTable<T extends { id?: string; uid?: string }>({
    data,
    columns,
    total,
    page,
    pageSize,
    onPageChange,
    loading,
    emptyMessage = 'No data found',
    emptyIcon,
}: DataTableProps<T>) {
    const totalPages = Math.ceil(total / pageSize);

    return (
        <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-black/20 text-gray-400 font-medium">
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                                    {emptyIcon && <div className="mb-3 flex justify-center">{emptyIcon}</div>}
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={item.id || item.uid || index} className="hover:bg-white/5 transition-colors">
                                    {columns.map((col) => (
                                        <td key={col.key} className={`px-6 py-4 ${col.className || ''}`}>
                                            {col.render
                                                ? col.render(item)
                                                : String((item as Record<string, unknown>)[col.key] || '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="border-t border-white/10 px-6 py-4">
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </GlassCard>
    );
}
