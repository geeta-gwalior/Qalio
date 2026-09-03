import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "",
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  // Determine range of pages to show
  let startPage = Math.max(currentPage - 1, 1);
  const endPage = Math.min(startPage + 2, totalPages);

  // Adjust startPage if we're at the end
  if (endPage - startPage < 2) {
    startPage = Math.max(endPage - 2, 1);
  }

  const visiblePages = [];
  for (let i = startPage; i <= endPage; i++) {
    visiblePages.push(i);
  }

  return (
    <div className={`flex my-6 justify-center items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(1)}
            className={`rounded-xl font-medium ${
              currentPage === 1
                ? "bg-indigo-600 text-white shadow-xs"
                : "border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            1
          </Button>
          {startPage > 2 && <span className="text-slate-400 font-medium px-1">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(page)}
          className={`rounded-xl font-medium ${
            currentPage === page
              ? "bg-indigo-600 text-white shadow-xs"
              : "border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="text-slate-400 font-medium px-1">...</span>
          )}
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(totalPages)}
            className={`rounded-xl font-medium ${
              currentPage === totalPages
                ? "bg-indigo-600 text-white shadow-xs"
                : "border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
            }`}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
