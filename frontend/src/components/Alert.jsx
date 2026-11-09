/**
 * Aviso de error o confirmación. "messages" es una lista de textos.
 * Los errores se anuncian a lectores de pantalla (role="alert").
 */
export default function Alert({ type = 'error', messages = [] }) {
  const list = (Array.isArray(messages) ? messages : [messages]).filter(Boolean)
  if (list.length === 0) return null

  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {list.length === 1 ? (
        <p>{list[0]}</p>
      ) : (
        <ul>
          {list.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
