import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="notice">
      <h1>No encontramos esa página</h1>
      <p>La dirección no existe o fue movida.</p>
      <Link to="/productos">Ir a productos</Link>
    </section>
  )
}
