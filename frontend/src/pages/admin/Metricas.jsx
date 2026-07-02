import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AdminNav from '../../components/AdminNav';

const MetricCard = ({ label, value, color, icon, trend }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend > 0 ? '+' : ''}{trend}% vs semana pasada
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
        {icon}
      </div>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-2">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-sm text-blue-600 font-medium">{payload[0].value} reservas</p>
      </div>
    );
  }
  return null;
};

export default function Metricas() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [income, setIncome] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [incomePeriod, setIncomePeriod] = useState('month');

  useEffect(() => {
    if (!user?.businessId) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/reservations/metrics/${user.businessId}`);
        setMetrics(data);

        const incomeData = await api.get(`/reservations/income/${user.businessId}`, {
          params: { period: incomePeriod }
        });
        setIncome(incomeData.data);

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
              date: day.slice(5).split('-').reverse().join('/'),
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
  }, [user, incomePeriod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AdminNav />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
          <div className="bg-white rounded-2xl h-80 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Métricas del negocio</h1>
          <p className="text-slate-500 text-sm mt-1">Resumen de rendimiento y estadísticas</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 text-red-700 p-4 text-sm flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <MetricCard
            label="Hoy"
            value={metrics?.today ?? 0}
            color="from-blue-500 to-blue-600"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <MetricCard
            label="Esta semana"
            value={metrics?.week ?? 0}
            color="from-emerald-500 to-emerald-600"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <MetricCard
            label="Este mes"
            value={metrics?.month ?? 0}
            color="from-purple-500 to-purple-600"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
          <MetricCard
            label="Tasa de cancelación"
            value={`${metrics?.cancellationRate ?? 0}%`}
            color="from-orange-500 to-orange-600"
            icon={
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-green-200 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos estimados</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  ${income?.totalIncome?.toFixed(2) ?? '0.00'}
                </p>
                <select
                  value={incomePeriod}
                  onChange={(e) => setIncomePeriod(e.target.value)}
                  className="mt-2 text-xs border border-slate-200 rounded-lg px-2 py-1"
                >
                  <option value="day">Hoy</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                </select>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-sm">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-800">Reservas en los últimos 7 días</h2>
            <p className="text-sm text-slate-500 mt-1">Distribución diaria de reservas</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
              <Bar
                dataKey="count"
                fill="url(#gradient)"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {metrics?.byEmployee && metrics.byEmployee.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Rendimiento por empleado</h2>
            <div className="space-y-3">
              {metrics.byEmployee.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">{emp.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{emp.count}</span>
                    <span className="text-slate-500 text-sm ml-1">reservas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}