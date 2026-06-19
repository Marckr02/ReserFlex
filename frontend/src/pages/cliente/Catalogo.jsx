import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { getTheme } from '../../utils/themeHelper';

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Top Banner Skeleton */}
      <div className="bg-slate-900 h-64 flex items-center justify-center relative overflow-hidden animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 opacity-90"></div>
        <div className="relative space-y-4 max-w-md w-full text-center px-4">
          <div className="h-3.5 w-28 mx-auto rounded-full bg-slate-700 animate-pulse"></div>
          <div className="h-9 w-64 mx-auto rounded-xl bg-slate-700 animate-pulse"></div>
          <div className="h-4 w-48 mx-auto rounded-lg bg-slate-700/60 animate-pulse"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="h-20 rounded-3xl bg-white shadow-sm border border-slate-100 p-4 mb-8">
          <div className="h-full w-full rounded-xl bg-slate-100 animate-shimmer"></div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-5">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-3 flex-1">
                  <div className="h-6 rounded bg-slate-200 animate-shimmer w-3/4"></div>
                  <div className="h-4 rounded bg-slate-100 animate-shimmer w-5/6"></div>
                  <div className="h-4 rounded bg-slate-100 animate-shimmer w-2/3"></div>
                </div>
                <div className="h-14 w-16 rounded-2xl bg-slate-100 animate-shimmer"></div>
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-7 w-20 rounded-full bg-slate-100 animate-shimmer"></div>
                <div className="h-7 w-24 rounded-full bg-slate-100 animate-shimmer"></div>
              </div>
              <div className="h-12 w-full rounded-2xl bg-slate-100 animate-shimmer pt-2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Catalogo() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const businessRes = await api.get(`/business/slug/${slug}`);
        setBusiness(businessRes.data);
        const servicesRes = await api.get(`/services/${businessRes.data.id}`);
        setServices(servicesRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar el catálogo');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const haystack = `${service.name} ${service.description || ''}`.toLowerCase();
      const searchMatch = !search || haystack.includes(search.toLowerCase());

      const priceMatch = priceRange === 'all'
        ? true
        : priceRange === '0-20'
          ? service.price <= 20
          : priceRange === '20-50'
            ? service.price > 20 && service.price <= 50
            : service.price > 50;

      const durationMatch = durationFilter === 'all'
        ? true
        : durationFilter === 'short'
          ? service.duration <= 30
          : durationFilter === 'medium'
            ? service.duration > 30 && service.duration <= 60
            : service.duration > 60;

      return searchMatch && priceMatch && durationMatch;
    });
  }, [services, search, priceRange, durationFilter]);

  const clearFilters = () => {
    setSearch('');
    setPriceRange('all');
    setDurationFilter('all');
  };

  const theme = useMemo(() => {
    return getTheme(business?.type);
  }, [business]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-lg border border-slate-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo no disponible</h1>
          <p className="mt-2 text-slate-600">{error || 'No se encontró el negocio solicitado.'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 inline-flex justify-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-48 right-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner with Dynamic Theme Gradient */}
      <div className={`bg-gradient-to-r ${theme.gradient} text-white relative overflow-hidden shadow-md`}>
        {/* Abstract vector shape overlay for visual interest */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,100 50,50 T100,50 L100,100 L0,100 Z" fill="currentColor"></path>
          </svg>
        </div>
        
        <div className="mx-auto max-w-6xl px-4 py-20 text-center relative z-10">
          <p className={`text-xs uppercase tracking-[0.4em] font-semibold ${theme.accentText} filter drop-shadow-sm`}>
            Catálogo de Servicios
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight filter drop-shadow-md">
            {business.name}
          </h1>
          <p className="mt-4 text-white/80 max-w-xl mx-auto flex items-center justify-center gap-1.5 text-sm sm:text-base font-medium">
            <svg className="h-4.5 w-4.5 opacity-80 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            {business.address}
          </p>
        </div>
      </div>

      {/* Filters and List Container */}
      <div className="mx-auto max-w-6xl px-4 py-8 relative z-10">
        
        {/* Search & Filters Glass Card */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 mb-8 transition hover:shadow-md duration-300">
          <div className="relative flex items-center">
            <span className="absolute left-4">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar servicio por nombre o palabra clave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-2xl border border-slate-200 pl-12 pr-4 py-3.5 text-base sm:text-sm shadow-inner transition focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent`}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5 items-center">
            <div className="relative">
              <select 
                value={priceRange} 
                onChange={(e) => setPriceRange(e.target.value)} 
                className="appearance-none rounded-xl border border-slate-200 pl-3 pr-8 py-2 text-sm bg-white font-medium text-slate-600 hover:border-slate-300 focus:outline-none transition-colors"
              >
                <option value="all">Cualquier precio</option>
                <option value="0-20">Hasta $20</option>
                <option value="20-50">$20 - $50</option>
                <option value="50+">Más de $50</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            <div className="relative">
              <select 
                value={durationFilter} 
                onChange={(e) => setDurationFilter(e.target.value)} 
                className="appearance-none rounded-xl border border-slate-200 pl-3 pr-8 py-2 text-sm bg-white font-medium text-slate-600 hover:border-slate-300 focus:outline-none transition-colors"
              >
                <option value="all">Cualquier duración</option>
                <option value="short">Menos de 30 min</option>
                <option value="medium">30 - 60 min</option>
                <option value="long">Más de 60 min</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>

            {(search || priceRange !== 'all' || durationFilter !== 'all') && (
              <button 
                onClick={clearFilters} 
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition flex items-center"
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-white p-12 text-center text-slate-500 shadow-sm border border-slate-200/80 max-w-xl mx-auto">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">No encontramos resultados</h3>
            <p className="mt-1 text-sm text-slate-500">Prueba cambiando tu término de búsqueda o ajustando los filtros.</p>
            <button 
              onClick={clearFilters} 
              className={`mt-5 inline-flex items-center rounded-2xl ${theme.button} px-5 py-2.5 text-sm font-semibold`}
            >
              Ver todos los servicios
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => (
              <div 
                key={service.id} 
                className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/70 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                        {service.name}
                      </h2>
                      <p className="mt-2 text-sm text-slate-500 line-clamp-3 font-medium leading-relaxed">
                        {service.description || 'Sin descripción detallada.'}
                      </p>
                    </div>
                    
                    <div className={`rounded-2xl ${theme.softBg} px-3.5 py-2 text-right border ${theme.border} shrink-0`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Desde
                      </span>
                      <span className={`text-xl font-black ${theme.primaryText}`}>
                        ${service.price}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100/90 text-slate-600 px-3 py-1.5 flex items-center border border-slate-200/50">
                      <svg className="h-3.5 w-3.5 mr-1 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {service.duration} min
                    </span>
                    <span className="rounded-full bg-slate-100/90 text-slate-600 px-3 py-1.5 flex items-center border border-slate-200/50">
                      <svg className="h-3.5 w-3.5 mr-1 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      {service.employeeServices?.length || 0} profesionales
                    </span>
                  </div>
                </div>

                <Link
                  to={`/reservar/${slug}?serviceId=${service.id}`}
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-2xl ${theme.button} px-4 py-3.5 font-bold tracking-wide transition shadow-sm hover:shadow`}
                >
                  Reservar ahora
                  <svg className="h-4.5 w-4.5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
