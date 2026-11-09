import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Mensaje de confirmación que llega desde otra pantalla (por ejemplo "Producto guardado.")
 * a través del estado de navegación. Se limpia del historial para que no reaparezca al recargar.
 */
export function useFlash() {
  const location = useLocation()
  const navigate = useNavigate()
  const [message, setMessage] = useState(() => location.state?.flash ?? '')

  useEffect(() => {
    if (location.state?.flash) {
      navigate(location.pathname + location.search, { replace: true, state: null })
    }
    // Solo al montar la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [message, setMessage]
}
