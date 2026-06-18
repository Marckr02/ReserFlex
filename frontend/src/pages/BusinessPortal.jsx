import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import RestaurantFloorPlan from '../components/RestaurantFloorPlan'
import api from '../services/api'

const BUSINESS_TYPES = {
  SALON_BARBERIA: 'Salón / Barbería',
  CONSULTORIO: 'Consultorio',
  RESTAURANTE: 'Restaurante',
  HOTEL: 'Hotel',
  CANCHA_GIMNASIO: 'Cancha / Gimnasio',
  GENERICO: 'Genérico'
}

export default function BusinessPortal() {
  const { slug } = useParams()
  const [business, setBusiness] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const { data } = await api.get(`/business/slug/${slug}`)
        setBusiness(data)
        const photosRes = await api.get(`/business/${data.id}/photos`)
        setPhotos(photosRes.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Negocio no encontrado')
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando negocio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Negocio no encontrado</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-slate-900 py-12 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center">
          {business.logoUrl && (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
            />
          )}
          <h1 className="text-4xl font-bold mb-2">{business.name}</h1>
          <p className="text-blue-200">{BUSINESS_TYPES[business.type] || business.type}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 -mt-6 pb-8">
        <div className="rounded-3xl bg-white p-6 shadow-lg border border-slate-200">
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{business.address}</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto text-center">
              <Link
                to={`/catalogo/${slug}`}
                className="rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Ver catálogo
              </Link>
              <Link
                to={`/reservar/${slug}`}
                className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700"
              >
                Reservar ahora
              </Link>
          </div>

          {photos.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-slate-900">Galería</h2>
                <p className="text-sm text-slate-500">Fotos del local, ambiente y servicio</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {photos.slice(0, 6).map((photo) => (
                  <img key={photo.id} src={photo.url} alt={photo.caption || business.name} className="h-40 w-full rounded-2xl object-cover" />
                ))}
              </div>
            </div>
          )}

          {business.type === 'RESTAURANTE' && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Mesas disponibles</h2>
                <p className="text-sm text-slate-500">Selecciona una mesa, fecha y hora para confirmar tu reserva.</p>
              </div>
              <RestaurantFloorPlan businessId={business.id} />
            </div>
          )}
        </div>

        <div className="text-center mt-6 pb-6">
          <a href="/login" className="text-blue-600 hover:underline">
            ¿Eres cliente de {business.name}? Inicia sesión
          </a>
        </div>
      </div>
    </div>
  )
}