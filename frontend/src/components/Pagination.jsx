/**
 * Total de elementos y, si hay más de una página, botones para moverse entre ellas.
 * "pagination" es el objeto meta.pagination que devuelve la API.
 */
export default function Pagination({ pagination, onPageChange, noun = ['elemento', 'elementos'] }) {
  if (!pagination) return null

  const { page, total, total_pages: totalPages } = pagination

  return (
    <div className="pagination">
      <span className="muted">
        {total} {total === 1 ? noun[0] : noun[1]}
      </span>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
