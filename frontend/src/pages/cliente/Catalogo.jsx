import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getTheme, isDarkTheme } from '../../utils/themeHelper';

function SkeletonLoader({ dark, mode = 'service' }) {
  const bg = dark ? 'bg-neutral-950' : 'bg-stone-50';
  const surface = dark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-100';
  const line = dark ? 'bg-neutral-800' : 'bg-stone-100';

  if (mode === 'directory') {
    return (
      <div className={`min-h-screen ${bg}`}>
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="space-y-3 mb-10">
            <div className={`h-3 w-20 rounded-full ${line} animate-pulse`}></div>
            <div className={`h-10 w-72 rounded-xl ${line} animate-pulse`}></div>
          </div>
          <div className="mb-6">
            <div className={`h-12 w-full rounded-2xl border ${dark ? 'border-neutral-800' : 'border-stone-200'} ${line} animate-pulse`}></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`rounded-3xl border p-6 ${surface}`}>
                <div className="flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-xl shrink-0 ${line} animate-pulse`}></div>
                  <div className="flex-1 space-y-3">
                    <div className={`h-5 w-32 rounded-lg ${line} animate-pulse`}></div>
                    <div className={`h-3 w-24 rounded ${line} animate-pulse`}></div>
                  </div>
                </div>
                <div className={`h-9 w-full rounded-xl mt-5 ${line} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="space-y-3 mb-10">
          <div className={`h-3 w-20 rounded-full ${line} animate-pulse`}></div>
          <div className={`h-10 w-72 rounded-xl ${line} animate-pulse`}></div>
          <div className={`h-4 w-96 rounded-lg ${line} animate-pulse`}></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`rounded-2xl border p-6 ${surface}`}>
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-3 flex-1">
                  <div className={`h-7 w-48 rounded-lg ${line} animate-pulse`}></div>
                  <div className={`h-4 w-full rounded ${line} animate-pulse`}></div>
                  <div className={`h-4 w-4/5 rounded ${line} animate-pulse`}></div>
                </div>
                <div className={`h-8 w-20 rounded-xl ${line} animate-pulse ml-auto`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FadeUp({ children, delay = 0 }) {
  return (
    <div style={{ animation: `fadeUp 0.45s ease-out ${delay}ms both` }}>
      {children}
    </div>
  );
}

const TYPE_LABELS = {
  SALON_BARBERIA: 'Salón / Barbería',
  CONSULTORIO: 'Consultorio',
  RESTAURANTE: 'Restaurante',
  HOTEL: 'Hotel',
  CANCHA_GIMNASIO: 'Cancha / Gimnasio',
  GENERICO: 'General',
};

export default function Catalogo() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [durationFilter, setDurationFilter] = useState('all');

  const isDirectory = !slug;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        if (isDirectory) {
          const { data } = await api.get('/business/public');
          setBusinesses(data);
      } else {
        const businessRes = await api.get(`/business/slug/${slug}`);
        setBusiness(businessRes.data);
        const servicesRes = await api.get(`/services/${businessRes.data.id}`);
        setServices(servicesRes.data || []);
      }
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, isDirectory]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const haystack = `${service.name} ${service.description || ''}`.toLowerCase();
      const searchMatch = !search || haystack.includes(search.toLowerCase());
      const priceMatch =
        priceRange === 'all' ||
        (priceRange === '0-20' && service.price <= 20) ||
        (priceRange === '20-50' && service.price > 20 && service.price <= 50) ||
        (priceRange === '50+' && service.price > 50);
      const durationMatch =
        durationFilter === 'all' ||
        (durationFilter === 'short' && service.duration <= 30) ||
        (durationFilter === 'medium' && service.duration > 30 && service.duration <= 60) ||
        (durationFilter === 'long' && service.duration > 60);
      return searchMatch && priceMatch && durationMatch;
    });
  }, [services, search, priceRange, durationFilter]);

  const filteredBusinesses = useMemo(() => {
    const q = search.toLowerCase();
    return businesses.filter((b) => `${b.name} ${b.address || ''}`.toLowerCase().includes(q));
  }, [businesses, search]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setPriceRange('all');
    setDurationFilter('all');
  }, []);

  const theme = useMemo(() => getTheme(business?.type), [business]);
  const dark = useMemo(() => isDarkTheme(business?.type), [business]);

  if (loading) {
    return <SkeletonLoader dark={dark} mode={isDirectory ? 'directory' : 'service'} />;
  }

  if (error || (!isDirectory && !business)) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-neutral-950' : 'bg-stone-50'}`}>
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-sm border border-stone-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-slate-100' : 'text-stone-800'}`}>
            {isDirectory ? 'Catálogo no disponible' : 'Negocio no encontrado'}
          </h1>
          <p className={`mt-2 text-sm ${dark ? 'text-slate-300' : 'text-stone-500'}`}>
            {error || 'No se encontró el negocio solicitado.'}
          </p>
          <button
            onClick={() => navigate(isDirectory ? '/catalogo' : -1)}
            className="mt-6 inline-flex justify-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition"
          >
            {isDirectory ? 'Reintentar' : 'Volver'}
          </button>
        </div>
      </div>
    );
  }

  if (isDirectory) {
    const hasFilters = search !== '';
    return (
      <div className={`min-h-screen pb-16 ${dark ? 'bg-neutral-950' : 'bg-stone-50'}`}>
        <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <div className="mx-auto max-w-5xl px-4 py-12">
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400 mb-2">Explora</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900">Catálogo de negocios</h1>
            <p className="mt-3 text-sm text-stone-500 max-w-lg">Elige un negocio para ver sus servicios disponibles y hacer una reserva al instante.</p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre o dirección..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition text-stone-900 placeholder:text-stone-400"
              />
            </div>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-stone-800">No se encontraron negocios</h3>
              <p className="mt-1 text-sm text-stone-500">Prueba con otro término de búsqueda.</p>
              {hasFilters && (
                <button onClick={() => setSearch('')} className="mt-5 inline-flex items-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBusinesses.map((biz, idx) => {
                const bizTheme = getTheme(biz.type);
                const bizDark = isDarkTheme(biz.type);
                const card = (
                  <div className={`rounded-3xl border p-6 shadow-sm transition-colors duration-200 ${ bizDark ? 'bg-neutral-900 border-neutral-800 hover:border-neutral-700' : 'bg-white border-stone-200/80 hover:border-stone-300' }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bizTheme.button}`}>
                        <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className={`text-lg font-bold leading-tight ${bizDark ? 'text-slate-100' : 'text-stone-900'}`}>{biz.name}</h3>
                        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider mt-2 ${bizTheme.badge}`}>
                          {TYPE_LABELS[biz.type] || biz.type}
                        </span>
                      </div>
                    </div>
                    {biz.address && (
                      <p className={`text-xs mt-1 line-clamp-1 ${bizDark ? 'text-slate-400' : 'text-stone-500'}`}>{biz.address}</p>
                    )}
                    <Link to={`/catalogo/${biz.slug}`} className={`mt-5 inline-flex w-full items-center justify-center rounded-xl ${bizTheme.button} px-4 py-2.5 text-xs font-bold tracking-wide`}>
                      Ver servicios →
                    </Link>
                  </div>
                );
                return <FadeUp key={biz.id} delay={idx * 55}>{card}</FadeUp>;
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasActiveFilters = search || priceRange !== 'all' || durationFilter !== 'all';

  return (
    <div className={`min-h-screen pb-16 ${dark ? 'bg-neutral-950' : 'bg-stone-50'}`}>
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <div className={`${theme.heroBg} border-b border-stone-200/60`}>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <div className="flex items-start gap-3">
            <div className={`w-1 rounded-full ${theme.primaryBg} shrink-0 self-stretch`}></div>
            <div>
              <p className={`text-[10px] uppercase tracking-[0.3em] font-bold ${theme.accentText} mb-1`}>
                {business.type === 'RESTAURANTE' ? 'La Carta' : 'Servicios'}
              </p>
              <h1 className={`text-3xl sm:text-4xl font-black tracking-tight leading-none ${dark ? 'text-slate-100' : 'text-stone-900'}`}>
                {business.name}
              </h1>
              <div className={`flex items-center gap-2 mt-3 text-sm ${dark ? 'text-slate-300' : 'text-stone-500'}`}>
                <svg className={`w-4 h-4 shrink-0 ${dark ? 'text-slate-400' : 'text-stone-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{business.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`mx-auto max-w-3xl px-4 py-6`}>
        <div className={`rounded-2xl border p-4 shadow-sm ${dark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200/80'}`}>
          <div className="relative">
            <svg className={`absolute left-4 top-1/2 h-5 w-5 ${dark ? 'text-slate-500 -translate-y-1/2' : 'text-stone-400 -translate-y-1/2'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-xl border pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent transition ${
                dark ? 'border-neutral-800 bg-neutral-900 text-slate-100 placeholder:text-slate-500' : 'border-stone-200 bg-white text-stone-900 placeholder:text-stone-400'
              }`}
            />
          </div>

          <div className={`mt-3 flex flex-wrap gap-2 items-center`}>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className={`appearance-none rounded-lg border pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none transition-colors cursor-pointer ${
                dark ? 'border-neutral-800 bg-neutral-900 text-slate-200 hover:border-neutral-700' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
              }`}
            >
              <option value="all">Precio</option>
              <option value="0-20">Hasta $20</option>
              <option value="20-50">$20 - $50</option>
              <option value="50+">Más de $50</option>
            </select>

            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className={`appearance-none rounded-lg border pl-3 pr-8 py-2 text-xs font-semibold focus:outline-none transition-colors cursor-pointer ${
                dark ? 'border-neutral-800 bg-neutral-900 text-slate-200 hover:border-neutral-700' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
              }`}
            >
              <option value="all">Duración</option>
              <option value="short">Menos de 30 min</option>
              <option value="medium">30 - 60 min</option>
              <option value="long">Más de 60 min</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className={`ml-auto rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1 transition ${
                  dark ? 'text-slate-300 hover:bg-neutral-800 hover:text-slate-100' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                }`}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`mx-auto max-w-3xl px-4`}>
        {filteredServices.length === 0 ? (
          <div className={`rounded-2xl border p-10 text-center shadow-sm ${dark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-stone-200/80'}`}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400 mb-4">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-base font-bold ${dark ? 'text-slate-100' : 'text-stone-800'}`}>
              {theme.microcopy?.emptyTitle || 'No se encontraron servicios.'}
            </h3>
            <p className={`mt-1 text-sm ${dark ? 'text-slate-300' : 'text-stone-500'}`}>{theme.microcopy?.emptyAction}</p>
            
            {theme.emptyIcon && (
              <div className={`mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full ${dark ? 'bg-neutral-800 text-neutral-400' : 'bg-stone-100 text-stone-400'}`}>
                {theme.emptyIcon}
              </div>
            )}
            <button onClick={clearFilters} className={`mt-6 inline-flex items-center rounded-xl ${theme.button} px-5 py-2.5 text-sm font-semibold`}>
              Ver todos
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={`rounded-2xl border p-5 sm:p-6 shadow-sm hover:shadow transition-shadow duration-200 ${
                  dark ? 'bg-neutral-900 border-neutral-800' : `${theme.cardBg} ${theme.cardBorder}`
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-xl font-bold leading-tight ${dark ? 'text-slate-100' : 'text-stone-900'}`}>{service.name}</h2>
                    {service.description && (
                      <p className={`mt-2 text-sm leading-relaxed line-clamp-2 ${dark ? 'text-slate-300' : 'text-stone-500'}`}>{service.description}</p>
                    )}
                    <div className={`mt-3 flex items-center gap-3 text-xs font-semibold ${dark ? 'text-slate-400' : 'text-stone-400'}`}>
                      <span className="flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {service.duration} min
                      </span>
                      {service.employeeServices?.length > 0 && (
                        <>
                          <span className={dark ? 'text-slate-600' : 'text-stone-300'}>·</span>
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {service.employeeServices.length} profesional{service.employeeServices.length !== 1 ? 'es' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-1 shrink-0">
                    <div className="text-right">
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${dark ? 'text-slate-400' : 'text-stone-400'}`}>Desde</p>
                      <p className={`text-2xl font-black ${dark ? 'text-slate-100' : 'text-stone-900'}`}>${service.price}</p>
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

      <div className="text-center pt-4">
        <Link
          to="/catalogo"
          className={`text-xs font-semibold transition tracking-wide ${
            dark ? 'text-slate-400 hover:text-slate-200' : 'text-stone-400 hover:text-stone-600'
          }`}
        >
          ← Explorar todos los negocios
        </Link>
      </div>
    </div>
  );
}
