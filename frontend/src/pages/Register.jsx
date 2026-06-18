import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

// Validar fortaleza de contraseña
const validatePassword = (password) => {
  const minLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[!@#$%^&*]/.test(password)

  return {
    valid: minLength && hasUpperCase && hasLowerCase && hasNumber,
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar
  }
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(null)

  const handlePasswordChange = (e) => {
    const pwd = e.target.value
    setForm({ ...form, password: pwd })
    setPasswordStrength(validatePassword(pwd))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setShowSuccess(false)
    setLoading(true)

    if (!passwordStrength?.valid) {
      setError('La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula y número')
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/register', form)
      setShowSuccess(true)
      setForm({ name: '', email: '', password: '' })
      setPasswordStrength(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-0">
      {showSuccess ? (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-md text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Registro exitoso!</h1>
          <p className="text-gray-600 mb-2">
            Se ha enviado un correo de verificación a:
          </p>
          <p className="font-semibold text-blue-600 mb-6 break-words">{form.email || 'tu correo'}</p>
          <p className="text-gray-600 mb-6">
            Haz clic en el enlace del correo para verificar tu cuenta y poder iniciar sesión.
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-blue-700">
            Crear cuenta
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Nombre completo
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Correo electrónico
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.password}
                onChange={handlePasswordChange}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mín. 8 caracteres, mayúscula, minúscula y número
              </p>
              {passwordStrength && form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${passwordStrength.minLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs">Mínimo 8 caracteres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${passwordStrength.hasUpperCase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs">Mayúscula (A-Z)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${passwordStrength.hasLowerCase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs">Minúscula (a-z)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${passwordStrength.hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-xs">Número (0-9)</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordStrength?.valid}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}