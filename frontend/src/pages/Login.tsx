import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

interface LoginForm { email: string; senha: string; }
interface RegisterForm { nome: string; email: string; telefone: string; senha: string; confirmarSenha: string; }

export default function Login() {
  const { login } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [showPass, setShowPass] = useState(false);
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
