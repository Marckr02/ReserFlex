import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Metricas() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.businessId) return;
    api.get(`/reservations/metrics/${user.businessId}`)
      .then(({ data }) => setMetrics(data))
      .catch(() => setError('No se pudieron cargar las métricas'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Métricas del negocio</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Hoy', value: metrics?.today ?? 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Esta semana', value: metrics?.week ?? 0, color: 'bg-green-50 text-green-700' },
            { label: 'Este mes', value: metrics?.month ?? 0, color: 'bg-purple-50 text-purple-700' },
            { label: 'Cancelaciones', value: `${metrics?.cancellationRate ?? 0}%`, color: 'bg-red-50 text-red-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-5 ${color}`}>
              <p className="text-sm font-medium opacity-70">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
