import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function processSession(accessToken: string) {
      try {
        const response = await api.post('/auth/oauth', { accessToken });
        login(response.data.token, response.data.usuario);
        navigate('/');
      } catch (err: any) {
        const msg = err?.response?.data?.error || 'Erro ao autenticar com Google';
        navigate(`/login?erro=${encodeURIComponent(msg)}`);
      }
    }

    // First: check if session is already available (Supabase may have processed hash already)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        processSession(session.access_token);
        return;
      }

      // Second: listen for auth state change (session not ready yet)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          processSession(session.access_token);
        }
      });

      // Fallback timeout
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        navigate('/login?erro=autenticacao_falhou');
      }, 10000);

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/25">
          <Scissors size={32} className="text-gray-900" />
        </div>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-medium">Autenticando com Google...</p>
        <p className="text-gray-500 text-sm mt-1">Aguarde um momento</p>
      </div>
    </div>
  );
}
