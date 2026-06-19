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
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-600 mx-auto"></div>
          <p className="text-slate-500 text-sm font-semibold">Cargando portal del negocio...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
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
    <div className="min-h-screen bg-slate-50/50 pb-16 relative">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-50/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Hero Banner with Dynamic Gradient Theme */}
      <div className={`bg-gradient-to-r ${theme.gradient} py-20 text-white text-center relative overflow-hidden shadow-md`}>
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,100 50,50 T100,50 L100,100 L0,100 Z" fill="currentColor"></path>
          </svg>
        </div>
        
        <div className="mx-auto max-w-5xl px-4 relative z-10 space-y-4">
          {business.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-24 h-24 mx-auto rounded-full object-cover shadow-md border-2 border-white/20"
            />
          ) : (
            <div className={`w-16 h-16 mx-auto rounded-2xl ${theme.softBg} ${theme.primaryText} flex items-center justify-center font-black text-2xl shadow-sm`}>
              {business.name.charAt(0)}
            </div>
          )}
          
          <h1 className="text-4xl font-extrabold tracking-tight filter drop-shadow-md">{business.name}</h1>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${theme.softBg} ${theme.primaryText}`}>
            {BUSINESS_TYPES[business.type] || business.type}
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-5xl px-4 -mt-8 relative z-10 pb-8">
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-8">
          
          {/* Address Bar */}
          <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm border-b border-slate-100 pb-5">
            <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{business.address}</span>
          </div>

          {/* Quick Actions Portal */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight text-center sm:text-left">¿Qué deseas realizar hoy?</h2>
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto pt-2">
              <Link
                to={`/catalogo/${slug}`}
                className={`rounded-2xl ${theme.button} px-5 py-4 font-bold tracking-wide transition shadow-sm hover:shadow text-center flex items-center justify-center gap-2`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
                Ver Catálogo de Servicios
              </Link>
              <Link
                to={`/reservar/${slug}`}
                className="rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-4 font-bold tracking-wide transition shadow-sm hover:shadow text-center flex items-center justify-center gap-2 transform active:scale-95"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Reservar Cita Online
              </Link>
            </div>
          </div>

          {/* Table reservation for Restaurant tenants */}
          {business.type === 'RESTAURANTE' && (
            <div className="mt-8 rounded-3xl border border-slate-200/80 bg-slate-50/50 p-5 sm:p-6 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <svg className="h-5.5 w-5.5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  Reservar Mesa Física
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  Visualiza la disponibilidad en tiempo real del plano de mesas y confirma tu ubicación favorita.
                </p>
              </div>
              <RestaurantFloorPlan businessId={business.id} />
            </div>
          )}

          {/* Photo Gallery Section */}
          {photos.length > 0 && (
            <div className="border-t border-slate-100 pt-6">
              <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 tracking-tight">Galería de Fotos</h2>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Recorre nuestras instalaciones y especialidades</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {photos.slice(0, 6).map((photo) => (
                  <div key={photo.id} className="overflow-hidden rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition duration-300 group">
                    <img 
                      src={photo.url} 
                      alt={photo.caption || business.name} 
                      className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
            ¿Eres administrador o empleado? Acceso al Panel →
          </Link>
        </div>
      </div>
    </div>
  );
}