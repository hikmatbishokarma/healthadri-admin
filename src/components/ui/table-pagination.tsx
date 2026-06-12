import { Button } from '@/components/ui/button';

export const PAGE_SIZE_OPTIONS = [10, 20, 50];
export const DEFAULT_PAGE_SIZE = 10;

interface TablePaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** Disable controls while a fetch is in flight. */
  disabled?: boolean;
}

/**
 * Shared table footer: a rows-per-page selector (always visible) plus Prev/Next
 * controls that appear only when there is more than one page. Changing the page
 * size resets back to page 1 so you never land out of range.
 */
export function TablePagination({
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          disabled={disabled}
          className="flex h-9 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Page {page} of {pageCount}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1 || disabled}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(pageCount, page + 1))}
              disabled={page === pageCount || disabled}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
