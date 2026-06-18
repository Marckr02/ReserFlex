import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin/dashboard', label: 'Inicio' },
  { to: '/admin/horarios', label: 'Horarios' },
  { to: '/admin/servicios', label: 'Servicios' },
  { to: '/admin/empleados', label: 'Empleados' },
  { to: '/admin/reservas', label: 'Reservas' },
  { to: '/admin/metricas', label: 'Métricas' },
];

export default function AdminNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navigationLinks = user?.businessType === 'RESTAURANTE'
    ? [...links, { to: '/admin/plano', label: 'Plano mesas' }]
    : links;

  return (
    <nav className="mb-6 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          <span className="font-bold text-blue-700">ReserFlex</span>
          <button
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 sm:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Abrir navegación"
          >
            ☰
          </button>

          <div className="hidden items-center gap-1 overflow-x-auto sm:flex">
            {navigationLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${pathname === link.to ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/perfil"
              className={`rounded-lg px-3 py-1.5 text-sm transition ${pathname === '/perfil' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              Perfil
            </Link>
          </div>

          <div className="hidden items-center gap-3 whitespace-nowrap sm:flex">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className={`sm:hidden ${menuOpen ? 'block' : 'hidden'} pb-4`}>
          <div className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            {navigationLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm transition ${pathname === link.to ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/perfil"
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm transition ${pathname === '/perfil' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              Perfil
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
