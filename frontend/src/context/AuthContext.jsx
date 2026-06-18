import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const id = localStorage.getItem('id')
    const role = localStorage.getItem('role')
    const name = localStorage.getItem('name')
    const businessId = localStorage.getItem('businessId')
    const businessType = localStorage.getItem('businessType')

    if (token) {
      setUser({ token, id, role, name, businessId, businessType })
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('token', data.token)
    if (data.id) {
      localStorage.setItem('id', data.id)
    } else {
      localStorage.removeItem('id')
    }
    localStorage.setItem('role', data.role)
    localStorage.setItem('name', data.name || '')
    if (data.businessId) {
      localStorage.setItem('businessId', data.businessId)
    } else {
      localStorage.removeItem('businessId')
    }
    if (data.businessType) {
      localStorage.setItem('businessType', data.businessType)
    } else {
      localStorage.removeItem('businessType')
    }
    setUser({ token: data.token, id: data.id || null, role: data.role, name: data.name, businessId: data.businessId || null, businessType: data.businessType || null })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('id')
    localStorage.removeItem('role')
    localStorage.removeItem('name')
    localStorage.removeItem('businessId')
    localStorage.removeItem('businessType')
    setUser(null)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)