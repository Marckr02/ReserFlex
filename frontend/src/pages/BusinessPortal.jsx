import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const { data } = await api.get(`/business/slug/${slug}`)
        setBusiness(data)
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
    <div className="min-h-screen bg-gray-100">
      <div className="bg-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
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

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{business.address}</span>
          </div>

          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Reservar Cita</h2>
            <p className="text-gray-600 mb-6">
              Sistema de reservas en línea. Selecciona el servicio y horario disponibles.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              <p className="font-medium">Funcionalidad disponible en Sprint 2</p>
              <p className="text-sm mt-1">Próximamente podrás reservar tu cita aquí.</p>
            </div>
          </div>
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