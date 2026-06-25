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

    async function handleCallback() {
      try {
        // PKCE flow: Supabase v2 sends ?code= in the URL
        const code = new URLSearchParams(window.location.search).get('code');
        let session = null;

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError || !data.session) {
            navigate('/login?erro=autenticacao_falhou');
            return;
          }
          session = data.session;
        } else {
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            navigate('/login?erro=autenticacao_falhou');
            return;
          }
          session = data.session;
        }

        const response = await api.post('/auth/oauth', {
          accessToken: session.access_token,
        });

        login(response.data.token, response.data.usuario);
        navigate('/');
      } catch (err: any) {
        const msg = err?.response?.data?.error || 'Erro ao autenticar com Google';
        navigate(`/login?erro=${encodeURIComponent(msg)}`);
      }
    }

    handleCallback();
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
