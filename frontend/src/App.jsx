import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import BusinessPortal from './pages/BusinessPortal'
import Horarios from './pages/admin/Horarios'
import Servicios from './pages/admin/Servicios'
import Empleados from './pages/admin/Empleados'
import ReservasAdmin from './pages/admin/ReservasAdmin'
import Metricas from './pages/admin/Metricas'
import PlanoRestaurante from './pages/admin/PlanoRestaurante'
import Resenas from './pages/admin/Resenas'
import Catalogo from './pages/cliente/Catalogo'
import Reservar from './pages/cliente/Reservar'
import MisReservas from './pages/cliente/MisReservas'
import Agenda from './pages/empleado/Agenda'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/catalogo/:slug" element={<Catalogo />} />
          <Route path="/reservar/:slug" element={<Reservar />} />
          <Route path="/mis-reservas" element={<PrivateRoute roles={['CLIENTE']}><MisReservas /></PrivateRoute>} />
          <Route path="/empleado/agenda" element={<PrivateRoute roles={['EMPLEADO']}><Agenda /></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin/dashboard" element={<PrivateRoute roles={['SUPER_ADMIN', 'ADMIN_NEGOCIO']}><Dashboard /></PrivateRoute>} />
          <Route path="/admin/negocios" element={<PrivateRoute roles={['SUPER_ADMIN']}><Dashboard /></PrivateRoute>} />
          <Route path="/admin/horarios" element={<PrivateRoute roles={['ADMIN_NEGOCIO', 'SUPER_ADMIN']}><Horarios /></PrivateRoute>} />
          <Route path="/admin/servicios" element={<PrivateRoute roles={['ADMIN_NEGOCIO', 'SUPER_ADMIN']}><Servicios /></PrivateRoute>} />
          <Route path="/admin/empleados" element={<PrivateRoute roles={['ADMIN_NEGOCIO', 'SUPER_ADMIN']}><Empleados /></PrivateRoute>} />
          <Route path="/admin/reservas" element={<PrivateRoute roles={['ADMIN_NEGOCIO', 'SUPER_ADMIN']}><ReservasAdmin /></PrivateRoute>} />
          <Route path="/admin/metricas" element={<PrivateRoute roles={['ADMIN_NEGOCIO', 'SUPER_ADMIN']}><Metricas /></PrivateRoute>} />
          <Route path="/admin/resenas" element={<PrivateRoute roles={['ADMIN_NEGOCIO', 'SUPER_ADMIN']}><Resenas /></PrivateRoute>} />
          <Route path="/admin/plano/:businessId?" element={<PrivateRoute roles={['ADMIN_NEGOCIO', 'SUPER_ADMIN']}><PlanoRestaurante /></PrivateRoute>} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/index" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/reservas/:slug"
            element={<BusinessPortal />}
          />
          <Route path="/reservas/:slug/*" element={<BusinessPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
