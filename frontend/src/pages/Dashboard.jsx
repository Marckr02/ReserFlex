import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const BUSINESS_TYPES = {
  SALON_BARBERIA: 'Salón / Barbería',
  CONSULTORIO: 'Consultorio',
  RESTAURANTE: 'Restaurante',
  HOTEL: 'Hotel',
  CANCHA_GIMNASIO: 'Cancha / Gimnasio',
  GENERICO: 'Genérico'
}

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '',
    type: 'SALON_BARBERIA',
    address: '',
    adminName: '',
    adminEmail: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchBusinesses()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchBusinesses = async () => {
    try {
      const { data } = await api.get('/business')
      setBusinesses(data)
    } catch (err) {
      console.error('Error fetching businesses:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBusiness = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      await api.post('/business', form)
      setSuccess('Negocio creado exitosamente')
      setShowModal(false)
      setForm({
        name: '',
        type: 'SALON_BARBERIA',
        address: '',
        adminName: '',
        adminEmail: ''
      })
      fetchBusinesses()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el negocio')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-blue-700">ReserFlex - Admin</h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Negocios</h2>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Crear Negocio
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : businesses.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No hay negocios registrados. Crea el primer negocio.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
                >
                  <h3 className="font-bold text-lg text-gray-800">{biz.name}</h3>
                  <p className="text-gray-500 text-sm">
                    {BUSINESS_TYPES[biz.type] || biz.type}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    Creado: {new Date(biz.createdAt).toLocaleDateString()}
                  </p>
                  <a
                    href={`/reservas/${biz.slug}`}
                    className="text-blue-600 hover:underline text-sm mt-2 block"
                  >
                    Ver portal →
                  </a>
                </div>
              ))}
            </div>
          )}
        </main>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">Crear Nuevo Negocio</h3>

              <form onSubmit={handleCreateBusiness} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {Object.entries(BUSINESS_TYPES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dirección</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nombre del Admin</label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email del Admin</label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-3 py-2"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    required
                  />
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {success && <div className="text-green-500 text-sm">{success}</div>}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (user?.role === 'ADMIN_NEGOCIO') {
    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-bold text-blue-700">ReserFlex - Mi Negocio</h1>
              <div className="flex items-center gap-4">
                <span className="text-gray-600">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Link to="/admin/horarios" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
              <h3 className="font-bold text-gray-800">Horarios</h3>
              <p className="text-sm text-gray-500 mt-1">Configura la disponibilidad semanal.</p>
            </Link>
            <Link to="/admin/servicios" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
              <h3 className="font-bold text-gray-800">Servicios</h3>
              <p className="text-sm text-gray-500 mt-1">Administra el catálogo y precios.</p>
            </Link>
            <Link to="/admin/empleados" className="bg-white rounded-lg shadow p-5 hover:shadow-md transition">
              <h3 className="font-bold text-gray-800">Empleados</h3>
              <p className="text-sm text-gray-500 mt-1">Asigna servicios al personal.</p>
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Panel de Administración</h2>
            <p className="text-gray-600">Gestiona las reservas de tu negocio.</p>
            <p className="text-gray-400 text-sm mt-4">(Sprint 2 - Coming Soon)</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold">Acceso no autorizado</h2>
        <button onClick={handleLogout} className="mt-4 text-blue-600 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}