import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import BusinessPortal from './pages/BusinessPortal'

const PrivateRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token) {
    return <Navigate to="/login" />
  }

  if (roles && role && !roles.includes(role)) {
    return <Navigate to="/" />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<VerifyEmail />} />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute roles={['SUPER_ADMIN', 'ADMIN_NEGOCIO']}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/reservas/:slug"
            element={<BusinessPortal />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App