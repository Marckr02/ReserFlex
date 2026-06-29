import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import RestaurantFloorPlan from '../components/RestaurantFloorPlan';
import api from '../services/api';
import { getTheme } from '../utils/themeHelper';

const BUSINESS_TYPES = {
  SALON_BARBERIA: 'Salón / Barbería',
  CONSULTORIO: 'Consultorio',
  RESTAURANTE: 'Restaurante',
  HOTEL: 'Hotel',
  CANCHA_GIMNASIO: 'Cancha / Gimnasio',
  GENERICO: 'Genérico'
};

export default function BusinessPortal() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const { data } = await api.get(`/business/slug/${slug}`);
        setBusiness(data);
        const photosRes = await api.get(`/business/${data.id}/photos`);
        setPhotos(photosRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Negocio no encontrado');
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [slug]);

  const theme = useMemo(() => {
    return getTheme(business?.type);
  }, [business]);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.heroBg} flex items-center justify-center`}>
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400 mx-auto"></div>
          <p className="text-slate-500 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Portal no encontrado</h1>
          <p className="text-slate-500 text-sm font-medium">{error || 'El negocio solicitado no se encuentra disponible.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.heroBg} pb-16`}>

      {/* Editorial Hero */}
      <div className={`${theme.heroBg} border-b border-slate-200/60`}>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12 gap-8">

            {/* Left: Logo + Name + Type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-4">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="w-14 h-14 rounded-xl object-cover shadow-sm border border-slate-200/80 shrink-0"
                  />
                ) : (
                  <div className={`w-14 h-14 rounded-xl ${theme.softBg} flex items-center justify-center shrink-0`}>
                    <span className={`text-2xl font-black ${theme.primaryText}`}>
                      {business.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${theme.accentText} mb-1`}>
                    {BUSINESS_TYPES[business.type] || business.type}
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                    {business.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-3 text-sm text-slate-500 font-medium">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{business.address}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - left aligned below info */}
              <div className="flex flex-wrap gap-3 mt-8">
                <Link
                  to={`/catalogo/${slug}`}
                  className={`rounded-xl ${theme.button} px-6 py-3 font-bold tracking-wide transition shadow-sm hover:shadow text-sm`}
                >
                  Ver servicios
                </Link>
                <Link
                  to={`/reservar/${slug}`}
                  className={`rounded-xl border-2 border-slate-900 bg-transparent hover:bg-slate-900 hover:text-white text-slate-900 px-6 py-3 font-bold tracking-wide transition text-sm`}
                >
                  Reservar ahora
                </Link>
              </div>
            </div>

            {/* Vertical divider - desktop only */}
            <div className="hidden lg:block w-px bg-slate-200/80 self-stretch"></div>

            {/* Right: Quick info panel */}
            <div className="lg:w-72 space-y-4">
              <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Horario</h2>
                <p className="text-sm text-slate-600 font-medium">
                  Consulta horarios disponibles para cada servicio en el catálogo.
                </p>
              </div>

              {business.type === 'RESTAURANTE' && (
                <div className="rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200/60 p-5 shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Reservación de mesa</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Disponible en el plano interactivo más abajo.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">

        {/* Table reservation for Restaurant tenants */}
        {business.type === 'RESTAURANTE' && (
          <div className="rounded-3xl bg-white border border-slate-200/80 p-6 shadow-sm">
            <div className="mb-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Plano de mesas</h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Selecciona una mesa disponible y reserva directamente.
              </p>
            </div>
            <RestaurantFloorPlan businessId={business.id} />
          </div>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Galería</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Recorre nuestras instalaciones</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.slice(0, 6).map((photo, i) => (
                <div
                  key={photo.id}
                  className={`overflow-hidden rounded-2xl border border-slate-200/60 shadow-xs group transition-all duration-300 hover:shadow-md ${
                    i === 0 && photos.length > 1 ? 'sm:col-span-2 sm:row-span-2' : ''
                  }`}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || business.name}
                    className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                      i === 0 && photos.length > 1 ? 'h-64 sm:h-full' : 'h-36'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="text-center pt-4">
        <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition tracking-wide">
          Acceso para administradores →
        </Link>
      </div>
    </div>
  );
}