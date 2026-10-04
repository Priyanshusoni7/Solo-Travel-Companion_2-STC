/** Pager for Spring Data pages serialized VIA_DTO: { content, page: { number, totalPages, totalElements } }. */
export default function Pagination({ page, onChange }) {
  if (!page || page.totalPages <= 1) return null;
  const { number, totalPages, totalElements } = page;
  return (
    <div className="flex items-center justify-between mt-6 text-xs text-gray-400">
      <span>
        Page {number + 1} of {totalPages} · {totalElements} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={number === 0}
          onClick={() => onChange(number - 1)}
          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="fas fa-chevron-left mr-1"></i> Previous
        </button>
        <button
          type="button"
          disabled={number + 1 >= totalPages}
          onClick={() => onChange(number + 1)}
          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next <i className="fas fa-chevron-right ml-1"></i>
        </button>
      </div>
    </div>
  );
}
