import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminNav from '../../components/AdminNav';
import api from '../../services/api';

export default function PlanoRestaurante() {
  const { businessId: businessIdParam } = useParams();
  const { user } = useAuth();
  const planRef = useRef(null);
  const businessId = businessIdParam || user?.businessId;
  const [tables, setTables] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [newTable, setNewTable] = useState({ number: '', capacity: 2, shape: 'round' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const [tablesRes, photosRes] = await Promise.all([
        api.get(`/tables/${businessId}`),
        api.get(`/business/${businessId}/photos`)
      ]);
      setTables(tablesRes.data);
      setPhotos(photosRes.data);
    } catch {
      setMessage('No se pudo cargar el plano');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleAddTable = async () => {
    if (!newTable.number || !newTable.capacity) return;
    const { data } = await api.post(`/tables/${businessId}`, newTable);
    setTables((current) => [...current, { ...data, status: 'available' }]);
    setNewTable({ number: '', capacity: 2, shape: 'round' });
    setMessage('Mesa creada');
  };

  const handleDeleteTable = async (tableId) => {
    await api.delete(`/tables/${tableId}`);
    setTables((current) => current.filter((table) => table.id !== tableId));
    setMessage('Mesa eliminada');
  };

  const handleDropTable = async (tableId, event) => {
    if (!planRef.current) return;
    const rect = planRef.current.getBoundingClientRect();
    const posX = ((event.clientX - rect.left) / rect.width) * 100;
    const posY = ((event.clientY - rect.top) / rect.height) * 100;
    await api.put(`/tables/${tableId}`, { posX, posY });
    setTables((current) => current.map((table) => (table.id === tableId ? { ...table, posX, posY } : table)));
  };

  const handlePhotoUpload = async (event) => {
    const formData = new FormData();
    Array.from(event.target.files || []).forEach((file) => formData.append('photos', file));
    const { data } = await api.post(`/business/${businessId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setPhotos((current) => [...current, ...data]);
    setMessage('Fotos subidas correctamente');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-8 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Restaurante</p>
          <h1 className="mt-2 text-3xl font-bold">Editor de plano</h1>
          <p className="mt-2 text-white/75">Agrega mesas, cambia su posición y sube fotos del local.</p>
        </div>

        {message && <p className="mb-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</p>}

        <div className="mb-6 rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-3">
            <input type="number" placeholder="Nº mesa" value={newTable.number} onChange={(e) => setNewTable({ ...newTable, number: e.target.value })} className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm" />
            <input type="number" placeholder="Capacidad" value={newTable.capacity} onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value, 10) })} className="w-28 rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm" />
            <select value={newTable.shape} onChange={(e) => setNewTable({ ...newTable, shape: e.target.value })} className="rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm">
              <option value="round">Redonda</option>
              <option value="square">Cuadrada</option>
              <option value="rectangle">Rectangular</option>
            </select>
            <button onClick={handleAddTable} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              + Agregar mesa
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Plano editable</h2>
          <div
            ref={planRef}
            className="relative h-[380px] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50"
            onDragOver={(event) => event.preventDefault()}
          >
            {tables.map((table) => (
              <button
                key={table.id}
                type="button"
                draggable
                onDragEnd={(event) => handleDropTable(table.id, event)}
                className={`absolute flex flex-col items-center justify-center border-2 border-blue-400 bg-blue-50 text-blue-700 ${table.shape === 'rectangle' ? 'h-[52px] w-[72px]' : 'h-[54px] w-[54px] rounded-full'}`}
                style={{ left: `${table.posX}%`, top: `${table.posY}%`, transform: 'translate(-50%, -50%)' }}
              >
                <span className="text-xs font-bold">M{table.number}</span>
                <span className="text-[11px] text-slate-500">👥 {table.capacity}</span>
                <span onClick={() => handleDeleteTable(table.id)} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Fotos del restaurante</h2>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="mb-4 text-sm" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {photos.map((photo) => (
              <img key={photo.id} src={photo.url} alt={photo.caption || 'Foto del restaurante'} className="h-28 w-full rounded-2xl object-cover" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}