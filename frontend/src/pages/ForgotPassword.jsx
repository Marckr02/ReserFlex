import { useState } from 'react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMsg(data.message);
    } catch {
      setMsg('Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-700">ReserFlex</h1>
        <h2 className="text-lg text-center mb-6 text-gray-600">Recuperar contraseña</h2>
        {msg ? (
          <p className="text-green-600 text-center">{msg}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" placeholder="Tu correo registrado"
              className="w-full border rounded-lg px-3 py-2"
              value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
            <p className="text-center text-sm">
              <a href="/login" className="text-blue-600 hover:underline">Volver al login</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
