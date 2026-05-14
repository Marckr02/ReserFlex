import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setStatus('error')
        return
      }

      try {
        await api.get(`/auth/verify?token=${token}`)
        setStatus('success')
      } catch (err) {
        setStatus('error')
      }
    }

    verify()
  }, [searchParams])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando tu correo...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error de verificación</h1>
          <p className="text-gray-600 mb-6">
            El enlace de verificación es inválido o ha expirado.
          </p>
          <Link
            to="/register"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Registrarse nuevamente
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Correo verificado!</h1>
        <p className="text-gray-600 mb-6">
          Tu cuenta ha sido verificada exitosamente. Ahora puedes iniciar sesión.
        </p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  )
}