import { Link, useNavigate } from 'react-router-dom';
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

  return (
    <nav className="mb-6 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="mr-4 font-bold text-blue-700">ReserFlex</span>
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-4 flex items-center gap-3 whitespace-nowrap">
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
    </nav>
  );
}
