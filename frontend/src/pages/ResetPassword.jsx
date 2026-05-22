import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      setMsg(data.message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Enlace inválido o expirado');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-700">Nueva contraseña</h1>
        {msg ? <p className="text-green-600 text-center">{msg}</p> : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="password" placeholder="Nueva contraseña (mín. 8 caracteres)"
              className="w-full border rounded-lg px-3 py-2"
              value={password} onChange={e => setPassword(e.target.value)}
              minLength={8} required />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              Cambiar contraseña
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
