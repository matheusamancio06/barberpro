import { useQuery } from '@tanstack/react-query';
import { Calendar, Users, DollarSign, Clock, TrendingUp, Scissors, CheckCircle, XCircle } from 'lucide-react';
import api from '../lib/api';

interface DashboardData {
  agendamentosHoje: number;
  agendamentosPendentes: number;
  totalClientes: number;
  totalBarbeiros: number;
  receitaHoje: number;
  receitaMes: number;
  proximosAgendamentos: Agendamento[];
  agendamentosHojeDetalhes: Agendamento[];
}

interface Agendamento {
  id: number;
  data: string;
  status: string;
  total: number;
  cliente: { nome: string };
  barbeiro: { nome: string };
  servicos: { servico: { nome: string } }[];
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 flex items-center gap-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    agendado: { label: 'Agendado', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    concluido: { label: 'Concluído', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    cancelado: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>{s.label}</span>;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function Dashboard() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="xl:col-span-2">
          <StatCard icon={Calendar} label="Agendamentos Hoje" value={d.agendamentosHoje} color="bg-amber-500" />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={Clock} label="Pendentes" value={d.agendamentosPendentes} color="bg-blue-500" />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={Users} label="Total Clientes" value={d.totalClientes} color="bg-purple-500" />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={Scissors} label="Barbeiros Ativos" value={d.totalBarbeiros} color="bg-teal-500" />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={DollarSign} label="Receita Hoje" value={formatCurrency(d.receitaHoje)} color="bg-green-500" />
        </div>
        <div className="xl:col-span-2">
          <StatCard icon={TrendingUp} label="Receita do Mês" value={formatCurrency(d.receitaMes)} color="bg-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agendamentos de Hoje */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl">
          <div className="p-5 border-b border-gray-700 flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" />
            <h2 className="text-white font-semibold">Agenda de Hoje</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {d.agendamentosHojeDetalhes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhum agendamento hoje</div>
            ) : (
              d.agendamentosHojeDetalhes.map((ag) => (
                <div key={ag.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-amber-400 font-bold text-sm">{formatTime(ag.data)}</p>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{ag.cliente.nome}</p>
                      <p className="text-gray-400 text-xs">{ag.barbeiro.nome} · {ag.servicos.map(s => s.servico.nome).join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={ag.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximos agendamentos */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl">
          <div className="p-5 border-b border-gray-700 flex items-center gap-2">
            <Clock size={18} className="text-blue-400" />
            <h2 className="text-white font-semibold">Próximos Agendamentos</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {d.proximosAgendamentos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhum agendamento futuro</div>
            ) : (
              d.proximosAgendamentos.map((ag) => (
                <div key={ag.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-amber-400 font-bold text-xs leading-none">
                        {new Date(ag.data).getDate()}
                      </span>
                      <span className="text-gray-400 text-xs leading-none">
                        {new Date(ag.data).toLocaleString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{ag.cliente.nome}</p>
                      <p className="text-gray-400 text-xs">{formatTime(ag.data)} · {ag.barbeiro.nome}</p>
                    </div>
                  </div>
                  <p className="text-green-400 text-sm font-medium">{formatCurrency(ag.total)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
