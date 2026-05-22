import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border border-slate-200">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Ruta no encontrada</h1>
        <p className="mt-3 text-slate-600">La página que buscas no existe o fue movida.</p>
        <Link to="/login" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
