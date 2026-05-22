import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AdminNav from '../../components/AdminNav';

export default function Metricas() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.businessId) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/reservations/metrics/${user.businessId}`);
        setMetrics(data);

        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        const counts = await Promise.all(
          days.map(async (day) => {
            const response = await api.get(`/reservations/business/${user.businessId}`, {
              params: { date: day }
            });
            return {
              date: day.slice(5),
              count: response.data.length
            };
          })
        );
        setDailyData(counts);
      } catch {
        setError('No se pudieron cargar las métricas');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminNav />
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

        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Reservas últimos 7 días</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
