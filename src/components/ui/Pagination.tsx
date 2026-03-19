import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const maxPagesShown = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesShown / 2));
    let endPage = startPage + maxPagesShown - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesShown + 1);
    }

    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    const handlePageClick = (e: React.MouseEvent, page: number) => {
        onPageChange(page);
        
        // Find the closest scrollable container and scroll to top
        const target = e.currentTarget as HTMLElement;
        const scrollContainer = target.closest('.overflow-y-auto') || target.closest('.custom-scrollbar');
        
        if (scrollContainer) {
            scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex items-center justify-center gap-1 mt-4 p-2 border-t border-white/5">
            <Button 
                variant="secondary" 
                onClick={(e) => handlePageClick(e, currentPage - 1)} 
                disabled={currentPage === 1}
                className="p-2 h-8 w-8 !p-0 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10"
            >
                <ChevronLeft size={16} />
            </Button>
            
            {startPage > 1 && (
                <>
                    <button onClick={(e) => handlePageClick(e, 1)} className="h-8 w-8 text-xs font-bold rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">1</button>
                    {startPage > 2 && <span className="text-slate-500 text-xs px-1">...</span>}
                </>
            )}

            {pages.map(page => (
                <button
                    key={page}
                    onClick={(e) => handlePageClick(e, page)}
                    className={clsx(
                        "h-8 w-8 text-xs font-bold rounded-lg transition-all",
                        currentPage === page 
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                    )}
                >
                    {page}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="text-slate-500 text-xs px-1">...</span>}
                    <button onClick={(e) => handlePageClick(e, totalPages)} className="h-8 w-8 text-xs font-bold rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">{totalPages}</button>
                </>
            )}

            <Button 
                variant="secondary" 
                onClick={(e) => handlePageClick(e, currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="p-2 h-8 w-8 !p-0 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10"
            >
                <ChevronRight size={16} />
            </Button>
        </div>
    )
}
