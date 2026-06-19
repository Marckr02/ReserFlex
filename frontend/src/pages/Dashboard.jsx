import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import AdminNav from '../components/AdminNav'

const BUSINESS_TYPES = {
  SALON_BARBERIA: { label: 'Salón / Barbería', color: 'bg-amber-100 text-amber-700', icon: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z' },
  CONSULTORIO: { label: 'Consultorio', color: 'bg-blue-100 text-blue-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  RESTAURANTE: { label: 'Restaurante', color: 'bg-rose-100 text-rose-700', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  HOTEL: { label: 'Hotel', color: 'bg-indigo-100 text-indigo-700', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  CANCHA_GIMNASIO: { label: 'Cancha / Gimnasio', color: 'bg-green-100 text-green-700', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  GENERICO: { label: 'Genérico', color: 'bg-slate-100 text-slate-700', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
}

const QuickActionCard = ({ to, title, description, icon, color, badge }) => (
  <Link
    to={to}
    className={`group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-300 hover:-translate-y-1`}
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${color} opacity-10 rounded-bl-[100px] transition-opacity group-hover:opacity-20`} />
    {badge && (
      <span className="absolute top-4 right-4 text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{badge}</span>
    )}
    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} text-white mb-4 shadow-sm`}>
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-slate-800 group-hover:text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{description}</p>
    <div className="mt-4 flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
      Ir
      <svg className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </div>
  </Link>
)

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
  const [slugPreview, setSlugPreview] = useState('')
  const [slugAvailable, setSlugAvailable] = useState(null)
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
      setSlugPreview('')
      setSlugAvailable(null)
      fetchBusinesses()
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el negocio')
    }
  }

  const normalizeSlug = (value) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  const handleNameBlur = async (e) => {
    const name = e.target.value.trim()
    if (!name) {
      setSlugPreview('')
      setSlugAvailable(null)
      return
    }

    const slug = normalizeSlug(name)
    setSlugPreview(slug)
    try {
      const { data } = await api.get(`/business/check-slug?name=${encodeURIComponent(name)}`)
      setSlugAvailable(data.available)
    } catch {
      setSlugAvailable(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleToggle = async (id) => {
    try {
      await api.patch(`/business/${id}/toggle`)
      setSuccess('Estado del negocio actualizado')
      fetchBusinesses()
    } catch {
      setError('Error al cambiar estado del negocio')
    }
  }

  if (user?.role === 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white shadow-sm border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-slate-800">Panel de Administración</h1>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/perfil')}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  {user.name}
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Negocios registrados</h2>
              <p className="text-slate-500 text-sm mt-1">Gestiona los negocios de la plataforma</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-blue-500/30"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear Negocio
            </button>
          </div>

          {success && (
            <div className="mb-6 rounded-xl bg-green-50 border border-green-100 text-green-700 p-4 text-sm flex items-center gap-3">
              <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">No hay negocios registrados</h3>
              <p className="text-slate-500 mt-1 mb-4">Comienza creando el primer negocio de la plataforma</p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear primer negocio
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {businesses.map((biz) => {
                const typeInfo = BUSINESS_TYPES[biz.type] || BUSINESS_TYPES.GENERICO
                return (
                  <div
                    key={biz.id}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-300"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-slate-800 truncate">{biz.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d={typeInfo.icon} />
                              </svg>
                              {typeInfo.label}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggle(biz.id)}
                          className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                            biz.active
                              ? 'bg-green-50 text-green-700 hover:bg-green-100'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {biz.active ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Creado {new Date(biz.createdAt).toLocaleDateString('es-EC', { dateStyle: 'medium' })}
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                      <a
                        href={`/reservas/${biz.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Ver portal
                      </a>
                      {biz.type === 'RESTAURANTE' && (
                        <Link
                          to={`/admin/plano/${biz.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                          </svg>
                          Plano
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Crear Nuevo Negocio</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreateBusiness} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del negocio</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onBlur={handleNameBlur}
                    placeholder="Ej: Barbería El Rey"
                    required
                  />
                  {slugPreview && (
                    <div className={`mt-2.5 text-sm flex items-center gap-2 ${slugAvailable === true ? 'text-green-600' : slugAvailable === false ? 'text-red-500' : 'text-slate-500'}`}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="font-medium">reservas/{slugPreview}</span>
                      {slugAvailable === true && <span className="text-green-500 font-semibold">✓ Disponible</span>}
                      {slugAvailable === false && <span className="text-red-500 font-semibold">✕ Ya está en uso</span>}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de negocio</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {Object.entries(BUSINESS_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Dirección</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Av. Principal #123, Ciudad"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Admin</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email del Admin</label>
                    <input
                      type="email"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-blue-500/30"
                  >
                    Crear negocio
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
      <div className="min-h-screen bg-slate-50">
        <AdminNav />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">Panel de Administración</h1>
            <p className="text-slate-500 mt-1">Gestiona las reservas y servicios de tu negocio</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <QuickActionCard
              to="/admin/horarios"
              title="Horarios"
              description="Configura la disponibilidad semanal de tu negocio"
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              color="from-blue-500 to-blue-600"
            />
            <QuickActionCard
              to="/admin/servicios"
              title="Servicios"
              description="Administra el catálogo de servicios y precios"
              icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              color="from-indigo-500 to-indigo-600"
            />
            <QuickActionCard
              to="/admin/empleados"
              title="Empleados"
              description="Gestiona tu equipo y asigna servicios"
              icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              color="from-purple-500 to-purple-600"
            />
            <QuickActionCard
              to="/admin/reservas"
              title="Reservas"
              description="Gestiona estados, clientes y agenda diaria"
              icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              color="from-emerald-500 to-emerald-600"
            />
            <QuickActionCard
              to="/admin/metricas"
              title="Métricas"
              description="Revisa el rendimiento y estadísticas"
              icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              color="from-orange-500 to-orange-600"
            />
            {user?.businessType === 'RESTAURANTE' && (
              <QuickActionCard
                to="/admin/plano"
                title="Plano de Mesas"
                description="Configura el layout y gestiona mesas"
                icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"
                color="from-rose-500 to-rose-600"
              />
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 mb-4">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">¡Todo está funcionando!</h2>
            <p className="text-slate-500 mt-2 max-w-md mx-auto">
              Tu negocio está listo para recibir reservas. Explora las opciones del panel para personalizar tu experiencia.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Acceso no autorizado</h2>
        <button onClick={handleLogout} className="mt-4 text-blue-600 hover:underline font-medium">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}