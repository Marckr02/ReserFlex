import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { getTheme } from '../../utils/themeHelper';

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="space-y-3 mb-10">
          <div className="h-3 w-20 rounded-full bg-stone-200 animate-pulse"></div>
          <div className="h-10 w-72 rounded-xl bg-stone-200 animate-pulse"></div>
          <div className="h-4 w-96 rounded-lg bg-stone-200/70 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-3 flex-1">
                  <div className="h-7 w-48 rounded-lg bg-stone-100 animate-pulse"></div>
                  <div className="h-4 w-full rounded bg-stone-100/70 animate-pulse"></div>
                  <div className="h-4 w-4/5 rounded bg-stone-100/50 animate-pulse"></div>
                </div>
                <div className="space-y-2 text-right">
                  <div className="h-8 w-16 rounded-xl bg-stone-100 animate-pulse ml-auto"></div>
                  <div className="h-5 w-20 rounded-full bg-stone-100/60 animate-pulse ml-auto"></div>
                </div>
              </div>
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-stone-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-800">Catálogo no disponible</h1>
          <p className="mt-2 text-stone-500 text-sm">{error || 'No se encontró el negocio solicitado.'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex justify-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const hasActiveFilters = search || priceRange !== 'all' || durationFilter !== 'all';

  return (
    <div className="min-h-screen bg-stone-50 pb-16">

      {/* Header */}
      <div className={`${theme.heroBg} border-b border-slate-200/60`}>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <div className="flex items-start gap-3">
            <div className={`w-1 rounded-full ${theme.primaryBg} shrink-0 self-stretch`}></div>
            <div>
              <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${theme.accentText} mb-1`}>
                {business.type === 'RESTAURANTE' ? 'La Carta' : 'Servicios'}
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight leading-none">
                {business.name}
              </h1>
              <div className="flex items-center gap-2 mt-3 text-sm text-stone-500 font-medium">
                <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>{business.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-sm">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-stone-200 pl-12 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="appearance-none rounded-lg border border-stone-200 pl-3 pr-8 py-2 text-xs font-semibold text-stone-600 bg-white hover:border-stone-300 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">Precio</option>
              <option value="0-20">Hasta $20</option>
              <option value="20-50">$20 - $50</option>
              <option value="50+">Más de $50</option>
            </select>

            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="appearance-none rounded-lg border border-stone-200 pl-3 pr-8 py-2 text-xs font-semibold text-stone-600 bg-white hover:border-stone-300 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="all">Duración</option>
              <option value="short">Menos de 30 min</option>
              <option value="medium">30 - 60 min</option>
              <option value="long">Más de 60 min</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto rounded-lg px-3 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition flex items-center gap-1"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Services List */}
      <div className="mx-auto max-w-3xl px-4">
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 p-10 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-stone-800">
              {theme.microcopy?.emptyTitle || 'No se encontraron servicios.'}
            </h3>
            <p className="mt-1 text-sm text-stone-500">
              {theme.microcopy?.emptyAction}
            </p>
            <button
              onClick={clearFilters}
              className={`mt-6 inline-flex items-center rounded-xl ${theme.button} px-5 py-2.5 text-sm font-semibold`}
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`${theme.cardBg} rounded-2xl border ${theme.cardBorder} p-5 sm:p-6 shadow-sm hover:shadow transition-shadow duration-200`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-stone-900 leading-tight">
                      {service.name}
                    </h2>
                    {service.description && (
                      <p className="mt-2 text-sm text-stone-500 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-stone-400">
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {service.duration} min
                      </span>
                      {service.employeeServices?.length > 0 && (
                        <>
                          <span className="text-stone-300">·</span>
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                            </svg>
                            {service.employeeServices.length} profesional{service.employeeServices.length !== 1 ? 'es' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-1 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold">Desde</p>
                      <p className="text-2xl font-black text-stone-900">${service.price}</p>
                    </div>
                    <Link
                      to={`/reservar/${slug}?serviceId=${service.id}`}
                      className={`rounded-xl ${theme.button} px-4 py-2 text-xs font-bold tracking-wide`}
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}