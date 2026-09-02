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
    <div className={`flex mb-7 justify-center items-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4 text-[#219CAE]" />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(1)}
            className={`${
              currentPage === 1 ? "bg-[#219CAE] text-white" : "text-[#219CAE]"
            }`}
          >
            1
          </Button>
          {startPage > 2 && <span className="text-[#219CAE]">...</span>}
        </>
      )}

      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(page)}
          className={`${
            currentPage === page ? "bg-[#219CAE] text-white" : "text-[#219CAE]"
          }`}
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="text-[#219CAE]">...</span>
          )}
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(totalPages)}
            className={`${
              currentPage === totalPages
                ? "bg-[#219CAE] text-white"
                : "text-[#219CAE]"
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
        className="disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4 text-[#219CAE]" />
      </Button>
    </div>
  );
}
