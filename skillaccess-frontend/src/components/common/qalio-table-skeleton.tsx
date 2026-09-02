import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentTableSkeletonProps {
  columns: number;
  rows?: number;
  showCheckbox?: boolean;
}

export function StudentTableSkeleton({
  columns,
  rows = 5,
  showCheckbox = false,
}: StudentTableSkeletonProps) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            {showCheckbox && (
              <TableHead className="w-[50px] pl-6">
                <Skeleton className="h-4 w-4" />
              </TableHead>
            )}
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i} className="font-semibold text-gray-700">
                <Skeleton className="h-4 w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex} className="animate-pulse">
              {showCheckbox && (
                <TableCell className="pl-6">
                  <Skeleton className="h-4 w-4" />
                </TableCell>
              )}
              <TableCell className="py-4">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              {Array.from({ length: columns - 1 }).map((_, colIndex) => (
                <TableCell key={colIndex} className="py-4">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
