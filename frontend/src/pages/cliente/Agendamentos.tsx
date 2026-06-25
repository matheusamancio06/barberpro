import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Calendar, XCircle, Filter } from 'lucide-react';
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

interface Barbeiro { id: number; nome: string; }
interface Servico { id: number; nome: string; preco: number; }

interface AgendamentoForm {
  barbeiroId: number;
  data: string;
  hora: string;
  observacoes?: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  agendado: { label: 'Agendado', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  concluido: { label: 'Concluído', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function ClienteAgendamentos() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedServicos, setSelectedServicos] = useState<number[]>([]);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const { data: agendamentos = [], isLoading } = useQuery<Agendamento[]>({
    queryKey: ['meus-agendamentos'],
    queryFn: () => api.get('/agendamentos').then(r => r.data),
  });

  const { data: barbeiros = [] } = useQuery<Barbeiro[]>({
    queryKey: ['barbeiros'],
    queryFn: () => api.get('/barbeiros').then(r => r.data),
  });

  const { data: servicos = [] } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: () => api.get('/servicos').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgendamentoForm>({
    defaultValues: { data: toDateInputValue(new Date()), hora: '09:00' }
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/agendamentos', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meus-agendamentos'] });
      toast.success('Agendamento criado!');
      closeModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao criar agendamento'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.put(`/agendamentos/${id}`, { status: 'cancelado' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meus-agendamentos'] });
      toast.success('Agendamento cancelado!');
      setCancelId(null);
    },
    onError: () => toast.error('Erro ao cancelar agendamento'),
  });

  const openCreate = () => {
    reset({ data: toDateInputValue(new Date()), hora: '09:00' });
    setSelectedServicos([]);
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); reset({}); setSelectedServicos([]); };

  const toggleServico = (id: number) => {
    setSelectedServicos(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const onSubmit = (data: AgendamentoForm) => {
    const dateTime = new Date(`${data.data}T${data.hora}`).toISOString();
    createMutation.mutate({
      barbeiroId: Number(data.barbeiroId),
      data: dateTime,
      observacoes: data.observacoes,
      servicoIds: selectedServicos,
    });
  };

  const filtered = agendamentos.filter(a => !filterStatus || a.status === filterStatus);

  const totalServicosSelected = servicos
    .filter(s => selectedServicos.includes(s.id))
    .reduce((sum, s) => sum + s.preco, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar size={24} className="text-amber-500" />Meus Agendamentos
          </h1>
          <p className="text-gray-400 text-sm mt-1">{agendamentos.length} agendamento(s) no total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />Novo Agendamento
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none">
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filtered.map(ag => {
              const d = new Date(ag.data);
              const isPast = d < new Date();
              const statusCfg = STATUS_CONFIG[ag.status] || { label: ag.status, cls: '' };
              return (
                <div key={ag.id} className="p-5 flex items-center gap-4 hover:bg-gray-700/40 transition-colors">
                  <div className="w-14 h-14 bg-gray-700 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 font-bold text-lg leading-none">{d.getDate()}</span>
                    <span className="text-gray-400 text-xs leading-none">{d.toLocaleString('pt-BR', { month: 'short' })}</span>
                    <span className="text-gray-500 text-xs leading-none">{d.getFullYear()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-semibold">{ag.barbeiro.nome}</p>
                      <span className="text-gray-500 text-sm">·</span>
                      <span className="text-amber-400 text-sm font-medium">
                        {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{ag.servicos.map(s => s.servico.nome).join(', ') || 'Sem serviços'}</p>
                    {ag.observacoes && <p className="text-gray-500 text-xs mt-0.5 italic">{ag.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-green-400 font-semibold">R$ {ag.total.toFixed(2)}</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                    {ag.status === 'agendado' && !isPast && (
                      <button
                        onClick={() => setCancelId(ag.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Cancelar"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title="Novo Agendamento" size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Barbeiro *</label>
            <select {...register('barbeiroId', { required: 'Barbeiro obrigatório' })} className="input-field">
              <option value="">Selecione o barbeiro...</option>
              {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
            {errors.barbeiroId && <p className="text-red-400 text-xs mt-1">{errors.barbeiroId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Data *</label>
              <input {...register('data', { required: 'Data obrigatória' })} type="date"
                min={toDateInputValue(new Date())} className="input-field" />
              {errors.data && <p className="text-red-400 text-xs mt-1">{errors.data.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Hora *</label>
              <input {...register('hora', { required: 'Hora obrigatória' })} type="time" className="input-field" />
              {errors.hora && <p className="text-red-400 text-xs mt-1">{errors.hora.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Serviços</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {servicos.map(s => (
                <label key={s.id}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedServicos.includes(s.id) ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedServicos.includes(s.id)} onChange={() => toggleServico(s.id)} className="accent-amber-500" />
                    <span className="text-sm">{s.nome}</span>
                  </div>
                  <span className="text-xs opacity-70">R$ {s.preco.toFixed(2)}</span>
                </label>
              ))}
            </div>
            {selectedServicos.length > 0 && (
              <p className="text-amber-400 text-sm mt-2 font-medium">Total: R$ {totalServicosSelected.toFixed(2)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
            <textarea {...register('observacoes')} rows={2} className="input-field resize-none" placeholder="Observações opcionais..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 py-2.5 rounded-lg font-semibold transition-colors">
              {createMutation.isPending ? 'Agendando...' : 'Agendar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={cancelId !== null} onClose={() => setCancelId(null)} title="Cancelar Agendamento" size="sm">
        <p className="text-gray-300 mb-6">Tem certeza que deseja cancelar este agendamento?</p>
        <div className="flex gap-3">
          <button onClick={() => setCancelId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Voltar</button>
          <button onClick={() => cancelId && cancelMutation.mutate(cancelId)} disabled={cancelMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">
            Cancelar Agendamento
          </button>
        </div>
      </Modal>
    </div>
  );
}
