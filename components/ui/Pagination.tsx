type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 overflow-x-auto border-t border-cactus-sand/60 px-4 py-4 sm:px-5">
      <p className="text-sm text-stone-500">
        Mostrando {start}–{end} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-semibold transition ${
              page === currentPage
                ? "bg-cactus-forest text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
