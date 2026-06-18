import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-slate-900">Catálogo no disponible</h1>
          <p className="mt-2 text-slate-600">{error || 'No se encontró el negocio'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-gradient-to-r from-blue-950 via-blue-800 to-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-blue-200">Catálogo de servicios</p>
          <h1 className="mt-3 text-4xl font-bold">{business.name}</h1>
          <p className="mt-2 text-white/75">{business.address}</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
          <input
            type="text"
            placeholder="Buscar servicio o descripción"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base sm:text-sm"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="all">Cualquier precio</option>
              <option value="0-20">Hasta $20</option>
              <option value="20-50">$20 - $50</option>
              <option value="50+">Más de $50</option>
            </select>

            <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="all">Cualquier duración</option>
              <option value="short">Menos de 30 min</option>
              <option value="medium">30 - 60 min</option>
              <option value="long">Más de 60 min</option>
            </select>

            {(search || priceRange !== 'all' || durationFilter !== 'all') && (
              <button onClick={clearFilters} className="rounded-xl px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="mt-5 rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
            <p>No se encontraron servicios con estos filtros</p>
            <button onClick={clearFilters} className="mt-3 text-sm font-medium text-blue-600 hover:underline">
              Ver todos los servicios
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service) => (
              <div key={service.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{service.name}</h2>
                    <p className="mt-2 text-sm text-slate-600">{service.description || 'Sin descripción'}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 px-3 py-2 text-right">
                    <p className="text-sm text-slate-500">Desde</p>
                    <p className="text-lg font-bold text-blue-700">${service.price}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-700">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{service.duration} min</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {service.employeeServices?.length || 0} empleados
                  </span>
                </div>

                <Link
                  to={`/reservar/${slug}?serviceId=${service.id}`}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700"
                >
                  Reservar ahora
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
