import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

interface LoginForm { email: string; senha: string; }
interface RegisterForm { nome: string; email: string; telefone: string; senha: string; confirmarSenha: string; }

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Show error passed via URL (from AuthCallback)
  useEffect(() => {
    const erro = searchParams.get('erro');
    if (erro) toast.error(decodeURIComponent(erro));
  }, []);

  const { register: regLogin, handleSubmit: handleLogin, formState: { errors: errLogin } } = useForm<LoginForm>();
  const { register: regReg, handleSubmit: handleReg, watch, formState: { errors: errReg } } = useForm<RegisterForm>();

  const loginMutation = useMutation({
    mutationFn: (data: LoginForm) => api.post('/auth/login', data).then(r => r.data),
    onSuccess: (data) => { login(data.token, data.usuario); toast.success(`Bem-vindo, ${data.usuario.nome}!`); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'E-mail ou senha incorretos'),
  });

  const registerMutation = useMutation({
    mutationFn: (data: Omit<RegisterForm, 'confirmarSenha'>) => api.post('/auth/registrar-cliente', data).then(r => r.data),
    onSuccess: (data) => { login(data.token, data.usuario); toast.success('Conta criada com sucesso!'); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao criar conta'),
  });

  const onLogin = (data: LoginForm) => loginMutation.mutate(data);
  const onRegister = (data: RegisterForm) => {
    const { confirmarSenha: _cs, ...rest } = data;
    registerMutation.mutate(rest);
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setGoogleLoading(false);
      toast.error(err.message || 'Erro ao conectar com Google');
    }
  };

  const inputCls = 'w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-all';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
            <Scissors size={32} className="text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold text-white">BarberPro</h1>
          <p className="text-gray-400 mt-1">Sistema de Gerenciamento de Barbearia</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-gray-700/50 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'login' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'register' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
            >
              Criar Conta
            </button>
          </div>

          {/* Google Button — visible only on login tab */}
          {tab === 'login' && (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-800 font-semibold py-3 rounded-xl transition-all mb-4"
              >
                {googleLoading
                  ? <div className="w-5 h-5 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                  : <GoogleIcon />
                }
                Entrar com Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-700" />
                <span className="text-gray-500 text-xs">ou</span>
                <div className="flex-1 h-px bg-gray-700" />
              </div>
            </>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin(onLogin)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
                <input
                  {...regLogin('email', { required: 'E-mail obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'E-mail inválido' } })}
                  type="email" placeholder="seu@email.com" className={inputCls}
                />
                {errLogin.email && <p className="text-red-400 text-xs mt-1">{errLogin.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    {...regLogin('senha', { required: 'Senha obrigatória' })}
                    type={showPass ? 'text' : 'password'} placeholder="••••••••"
                    className={`${inputCls} pr-12`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errLogin.senha && <p className="text-red-400 text-xs mt-1">{errLogin.senha.message}</p>}
              </div>
              <button type="submit" disabled={loginMutation.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                {loginMutation.isPending ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : 'Entrar'}
              </button>
              <p className="text-center text-gray-500 text-xs">
                Admins e barbeiros usam as credenciais fornecidas pelo administrador.
              </p>
            </form>
          ) : (
            <form onSubmit={handleReg(onRegister)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Nome completo</label>
                <input {...regReg('nome', { required: 'Nome obrigatório' })} type="text" placeholder="Seu nome" className={inputCls} />
                {errReg.nome && <p className="text-red-400 text-xs mt-1">{errReg.nome.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">E-mail</label>
                <input
                  {...regReg('email', { required: 'E-mail obrigatório', pattern: { value: /^\S+@\S+$/i, message: 'E-mail inválido' } })}
                  type="email" placeholder="seu@gmail.com" className={inputCls}
                />
                {errReg.email && <p className="text-red-400 text-xs mt-1">{errReg.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Telefone</label>
                <input {...regReg('telefone', { required: 'Telefone obrigatório' })} type="tel" placeholder="(11) 99999-9999" className={inputCls} />
                {errReg.telefone && <p className="text-red-400 text-xs mt-1">{errReg.telefone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
                <input
                  {...regReg('senha', { required: 'Senha obrigatória', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })}
                  type="password" placeholder="••••••••" className={inputCls}
                />
                {errReg.senha && <p className="text-red-400 text-xs mt-1">{errReg.senha.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmar senha</label>
                <input
                  {...regReg('confirmarSenha', { required: 'Confirme a senha', validate: v => v === watch('senha') || 'Senhas não coincidem' })}
                  type="password" placeholder="••••••••" className={inputCls}
                />
                {errReg.confirmarSenha && <p className="text-red-400 text-xs mt-1">{errReg.confirmarSenha.message}</p>}
              </div>
              <button type="submit" disabled={registerMutation.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                {registerMutation.isPending ? <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> : 'Criar Conta de Cliente'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
