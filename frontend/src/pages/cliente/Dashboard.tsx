import { useQuery } from '@tanstack/react-query';
import { Calendar, Package, CreditCard, Clock, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

interface Agendamento {
  id: number;
  data: string;
  status: string;
  total: number;
  barbeiro: { nome: string };
  servicos: { servico: { nome: string } }[];
}

interface Assinatura {
  id: number;
  dataFim: string;
  ativo: boolean;
  plano: { nome: string; preco: number };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  agendado: { label: 'Agendado', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  concluido: { label: 'Concluído', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function ClienteDashboard() {
  const { usuario } = useAuth();

  const { data: agendamentos = [] } = useQuery<Agendamento[]>({
    queryKey: ['meus-agendamentos'],
    queryFn: () => api.get('/agendamentos').then(r => r.data),
  });

  const { data: assinaturas = [] } = useQuery<Assinatura[]>({
    queryKey: ['minhas-assinaturas'],
    queryFn: () => api.get('/planos/minhas-assinaturas').then(r => r.data),
    retry: false,
  });

  const now = new Date();
  const proximos = agendamentos
    .filter(a => new Date(a.data) >= now && a.status === 'agendado')
    .slice(0, 3);

  const assinaturaAtiva = assinaturas.find(a => a.ativo && new Date(a.dataFim) >= now);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Olá, {usuario?.nome.split(' ')[0]}!
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/cliente/agendamentos"
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center gap-4 hover:bg-amber-500/20 transition-colors group"
        >
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <Calendar size={22} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-amber-400 font-semibold">Agendamentos</p>
            <p className="text-gray-400 text-xs">{proximos.length} próximo(s)</p>
          </div>
          <ArrowRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/cliente/produtos"
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5 flex items-center gap-4 hover:bg-purple-500/20 transition-colors group"
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Package size={22} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-purple-400 font-semibold">Produtos</p>
            <p className="text-gray-400 text-xs">Reservar produtos</p>
          </div>
          <ArrowRight size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/cliente/agendamentos"
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 flex items-center gap-4 hover:bg-green-500/20 transition-colors group"
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <Plus size={22} className="text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-green-400 font-semibold">Novo Agendamento</p>
            <p className="text-gray-400 text-xs">Agendar horário</p>
          </div>
          <ArrowRight size={16} className="text-green-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Active subscription */}
      {assinaturaAtiva && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={18} className="text-amber-500" />
            <h2 className="text-white font-semibold">Plano Ativo</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg">{assinaturaAtiva.plano.nome}</p>
              <p className="text-gray-400 text-sm">Válido até {new Date(assinaturaAtiva.dataFim).toLocaleDateString('pt-BR')}</p>
            </div>
            <p className="text-green-400 font-bold text-xl">R$ {assinaturaAtiva.plano.preco.toFixed(2)}/mês</p>
          </div>
        </div>
      )}

      {/* Upcoming appointments */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl">
        <div className="p-5 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-blue-400" />
            <h2 className="text-white font-semibold">Próximos Agendamentos</h2>
          </div>
          <Link to="/cliente/agendamentos" className="text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors">
            Ver todos
          </Link>
        </div>
        <div className="divide-y divide-gray-700">
          {proximos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar size={36} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum agendamento futuro</p>
              <Link to="/cliente/agendamentos" className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm mt-2 transition-colors">
                <Plus size={14} />Agendar agora
              </Link>
            </div>
          ) : (
            proximos.map(ag => {
              const d = new Date(ag.data);
              const statusCfg = STATUS_CONFIG[ag.status] || { label: ag.status, cls: '' };
              return (
                <div key={ag.id} className="p-4 flex items-center gap-4 hover:bg-gray-700/40 transition-colors">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold text-sm leading-none">{d.getDate()}</span>
                    <span className="text-gray-400 text-xs leading-none">{d.toLocaleString('pt-BR', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{ag.barbeiro.nome}</p>
                    <p className="text-gray-400 text-sm">{ag.servicos.map(s => s.servico.nome).join(', ')} · {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-green-400 font-medium">R$ {ag.total.toFixed(2)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.cls}`}>{statusCfg.label}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
