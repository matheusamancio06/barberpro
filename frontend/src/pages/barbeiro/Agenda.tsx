import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, DollarSign, Clock, CheckCircle, XCircle, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';

interface Agendamento {
  id: number;
  data: string;
  status: string;
  total: number;
  observacoes?: string;
  cliente: { id: number; nome: string; telefone: string };
  barbeiro: { id: number; nome: string };
  servicos: { servico: { id: number; nome: string; preco: number } }[];
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  agendado: { label: 'Agendado', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  concluido: { label: 'Concluído', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function BarbeiroAgenda() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [statusModal, setStatusModal] = useState<{ id: number; status: string } | null>(null);

  const { data: agendamentos = [], isLoading } = useQuery<Agendamento[]>({
    queryKey: ['agendamentos-barbeiro', selectedDate],
    queryFn: () => api.get(`/agendamentos?data=${selectedDate}`).then(r => r.data),
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/agendamentos/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agendamentos-barbeiro'] });
      toast.success('Status atualizado!');
      setStatusModal(null);
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const hoje = toDateInputValue(new Date());
  const isToday = selectedDate === hoje;

  const receitaConcluida = agendamentos
    .filter(a => a.status === 'concluido')
    .reduce((sum, a) => sum + a.total, 0);

  const pendentes = agendamentos.filter(a => a.status === 'agendado').length;

  const displayDate = new Date(selectedDate + 'T12:00:00');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Scissors size={24} className="text-amber-500" />Minha Agenda
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {displayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          {isToday && <span className="ml-2 text-amber-400 font-medium">— Hoje</span>}
        </p>
      </div>

      {/* Date picker + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <Calendar size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-gray-400 text-xs mb-1">Data</p>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-white focus:outline-none w-full"
            />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-blue-400 flex-shrink-0" />
          <div>
            <p className="text-gray-400 text-xs">Pendentes</p>
            <p className="text-white text-2xl font-bold">{pendentes}</p>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-3">
          <DollarSign size={20} className="text-green-400 flex-shrink-0" />
          <div>
            <p className="text-gray-400 text-xs">Receita do Dia</p>
            <p className="text-white text-2xl font-bold">R$ {receitaConcluida.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-700">
          <h2 className="text-white font-semibold">{agendamentos.length} agendamento(s)</h2>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : agendamentos.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum agendamento para este dia</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {agendamentos.map(ag => {
              const time = new Date(ag.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const statusCfg = STATUS_CONFIG[ag.status] || { label: ag.status, cls: '' };
              return (
                <div key={ag.id} className="p-5 flex items-center gap-4 hover:bg-gray-700/40 transition-colors">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-amber-400 font-bold text-lg leading-none">{time}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{ag.cliente.nome}</p>
                    <p className="text-gray-400 text-sm">{ag.servicos.map(s => s.servico.nome).join(', ') || 'Sem serviços'}</p>
                    {ag.observacoes && <p className="text-gray-500 text-xs mt-0.5 italic">{ag.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-green-400 font-semibold">R$ {ag.total.toFixed(2)}</p>
                    <button
                      onClick={() => setStatusModal({ id: ag.id, status: ag.status })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${statusCfg.cls}`}
                    >
                      {statusCfg.label}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Modal */}
      <Modal isOpen={statusModal !== null} onClose={() => setStatusModal(null)} title="Alterar Status" size="sm">
        <div className="space-y-3">
          {Object.entries(STATUS_CONFIG).map(([key, { label, cls }]) => (
            <button
              key={key}
              onClick={() => statusModal && updateMutation.mutate({ id: statusModal.id, status: key })}
              disabled={updateMutation.isPending}
              className={`w-full py-3 rounded-lg font-medium border transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${key === statusModal?.status ? cls + ' ring-2 ring-offset-1 ring-offset-gray-800' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
            >
              {key === 'concluido' && <CheckCircle size={16} />}
              {key === 'cancelado' && <XCircle size={16} />}
              {label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
