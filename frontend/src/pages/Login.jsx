import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const ROLE_ROUTES = {
  SUPER_ADMIN: '/admin',
  ADMIN_NEGOCIO: '/admin/servicios',
  EMPLEADO: '/empleado/agenda',
  CLIENTE: '/catalogo'
}

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Reservas inteligentes',
    desc: 'Gestiona tu agenda de forma automática'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Equipo sincronizado',
    desc: 'Coordina empleados y servicios en tiempo real'
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Métricas claras',
    desc: 'Visualiza el rendimiento de tu negocio'
  }
]

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = target
    const duration = 2000
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [target])

  return (
    <span>{count.toLocaleString()}{suffix}</span>
  )
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await api.post('/auth/login', form)
      login(data)
      navigate(ROLE_ROUTES[data.role] || '/admin')
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#1e40af] to-[#4338ca]">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 border border-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 border border-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 border border-white/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Geometric shapes */}
        <div className="absolute top-1/4 right-0 w-40 h-[500px] bg-gradient-to-b from-white/5 to-transparent skew-x-12"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between w-full p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ReserFlex</h1>
              <p className="text-white/60 text-sm font-medium">Plataforma de reservas</p>
            </div>
          </div>

          {/* Main message */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
                Tu negocio,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">siempre reservado</span>
              </h2>
              <p className="text-white/70 text-lg font-medium max-w-md leading-relaxed">
                La plataforma completa para gestionar reservas, clientes y operaciones de tu negocio en un solo lugar.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="text-3xl xl:text-4xl font-black text-white">
                  <AnimatedCounter target={2847} suffix="+" />
                </div>
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider">Negocios activos</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl xl:text-4xl font-black text-white">
                  <AnimatedCounter target={156} suffix="K" />
                </div>
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider">Reservas/mes</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl xl:text-4xl font-black text-white">
                  <AnimatedCounter target={99} suffix="%" />
                </div>
                <div className="text-white/50 text-xs font-semibold uppercase tracking-wider">Satisfacción</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/80">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{feature.title}</h4>
                    <p className="text-white/50 text-xs">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/40 text-sm font-medium">
            © 2024 ReserFlex. Todos los derechos reservados.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-white relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/50 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-50/30 to-transparent rounded-full blur-3xl"></div>

        <div className="relative w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#4338ca] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">ReserFlex</h1>
              <p className="text-slate-500 text-xs">Sistema de reservas</p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              ¡Bienvenido de nuevo!
            </h2>
            <p className="text-slate-500 mt-2 font-medium">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-base sm:text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-base sm:text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center gap-3">
                <svg className="h-5 w-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#1e3a5f] to-[#4338ca] text-white py-3.5 rounded-xl hover:from-[#1e40af] hover:to-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-base shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-900/30 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-600 text-sm">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>

          {/* Mobile stats - visible only on mobile */}
          <div className="lg:hidden mt-8 grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl">
            <div className="text-center">
              <div className="text-2xl font-black text-slate-800">2,847+</div>
              <div className="text-xs text-slate-500 font-medium">Negocios</div>
            </div>
            <div className="text-center border-x border-slate-200">
              <div className="text-2xl font-black text-slate-800">156K</div>
              <div className="text-xs text-slate-500 font-medium">Reservas/mes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-800">99%</div>
              <div className="text-xs text-slate-500 font-medium">Satisfacción</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}