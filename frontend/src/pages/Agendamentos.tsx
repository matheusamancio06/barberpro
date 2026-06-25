import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit2, Trash2, Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';

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

interface Cliente { id: number; nome: string; telefone: string; }
interface Barbeiro { id: number; nome: string; }
interface Servico { id: number; nome: string; preco: number; }

interface AgendamentoForm {
  clienteId: number;
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

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('pt-BR'),
    time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function toDateInputValue(date: Date) {
  return date.toISOString().split('T')[0];
}

export default function Agendamentos() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Agendamento | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<{ id: number; status: string } | null>(null);
  const [selectedServicos, setSelectedServicos] = useState<number[]>([]);

  const { data: agendamentos = [], isLoading } = useQuery<Agendamento[]>({
    queryKey: ['agendamentos', selectedDate],
    queryFn: () => api.get(`/agendamentos?data=${selectedDate}`).then(r => r.data),
  });

  const { data: clientes = [] } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => api.get('/clientes').then(r => r.data),
  });

  const { data: barbeiros = [] } = useQuery<Barbeiro[]>({
    queryKey: ['barbeiros'],
    queryFn: () => api.get('/barbeiros').then(r => r.data),
  });

  const { data: servicos = [] } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: () => api.get('/servicos').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgendamentoForm>();

  const createMutation = useMutation({
    mutationFn: (data: AgendamentoForm & { servicoIds: number[] }) => api.post('/agendamentos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agendamentos'] }); toast.success('Agendamento criado!'); closeModal(); },
    onError: () => toast.error('Erro ao criar agendamento'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AgendamentoForm> & { status?: string; servicoIds?: number[] } }) => api.put(`/agendamentos/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agendamentos'] }); toast.success('Agendamento atualizado!'); closeModal(); setStatusModal(null); },
    onError: () => toast.error('Erro ao atualizar agendamento'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/agendamentos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agendamentos'] }); toast.success('Agendamento excluído!'); setDeleteId(null); },
    onError: () => toast.error('Erro ao excluir agendamento'),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ data: selectedDate, hora: '09:00' });
    setSelectedServicos([]);
    setModalOpen(true);
  };

  const openEdit = (ag: Agendamento) => {
    setEditing(ag);
    const d = new Date(ag.data);
    reset({
      clienteId: ag.cliente.id, barbeiroId: ag.barbeiro.id,
      data: toDateInputValue(d),
      hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      observacoes: ag.observacoes || ''
    });
    setSelectedServicos(ag.servicos.map(s => s.servico.id));
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); reset({}); setSelectedServicos([]); };

  const toggleServico = (id: number) => {
    setSelectedServicos(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const onSubmit = (data: AgendamentoForm) => {
    const dateTime = new Date(`${data.data}T${data.hora}`).toISOString();
    const payload = { clienteId: Number(data.clienteId), barbeiroId: Number(data.barbeiroId), data: dateTime, observacoes: data.observacoes, servicoIds: selectedServicos };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(toDateInputValue(d));
  };

  const displayDate = new Date(selectedDate + 'T12:00:00');
  const isToday = selectedDate === toDateInputValue(new Date());

  const filtered = agendamentos.filter(ag => {
    const matchSearch = ag.cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
      ag.barbeiro.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || ag.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalReceita = filtered.filter(a => a.status === 'concluido').reduce((sum, a) => sum + a.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Calendar size={24} className="text-amber-500" />Agendamentos</h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} agendamento(s) · Receita concluída: R$ {totalReceita.toFixed(2)}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />Novo Agendamento
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-xl p-4">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><ChevronLeft size={18} /></button>
        <div className="flex-1 text-center">
          <p className="text-white font-semibold text-lg">
            {displayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {isToday && <span className="text-amber-400 text-xs font-medium">Hoje</span>}
        </div>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-amber-500" />
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"><ChevronRight size={18} /></button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar cliente ou barbeiro..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors" />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors appearance-none">
            <option value="">Todos os status</option>
            <option value="agendado">Agendado</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum agendamento para este dia</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filtered.map(ag => {
              const { time } = formatDateTime(ag.data);
              const statusCfg = STATUS_CONFIG[ag.status] || { label: ag.status, cls: '' };
              return (
                <div key={ag.id} className="p-5 flex items-center gap-4 hover:bg-gray-700/40 transition-colors">
                  <div className="w-16 text-center flex-shrink-0">
                    <p className="text-amber-400 font-bold text-lg leading-none">{time}</p>
                  </div>
                  <div className="w-px h-12 bg-gray-700" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold">{ag.cliente.nome}</p>
                      <span className="text-gray-500 text-xs">{ag.cliente.telefone}</span>
                    </div>
                    <p className="text-gray-400 text-sm">{ag.barbeiro.nome} · {ag.servicos.map(s => s.servico.nome).join(', ') || 'Sem serviços'}</p>
                    {ag.observacoes && <p className="text-gray-500 text-xs mt-1 italic">{ag.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <p className="text-green-400 font-semibold">R$ {ag.total.toFixed(2)}</p>
                    <button
                      onClick={() => setStatusModal({ id: ag.id, status: ag.status })}
                      className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${statusCfg.cls}`}
                    >
                      {statusCfg.label}
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(ag)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 size={15} /></button>
                      <button onClick={() => setDeleteId(ag.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Agendamento' : 'Novo Agendamento'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Cliente *</label>
              <select {...register('clienteId', { required: 'Cliente obrigatório' })} className="input-field">
                <option value="">Selecione o cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              {errors.clienteId && <p className="text-red-400 text-xs mt-1">{errors.clienteId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Barbeiro *</label>
              <select {...register('barbeiroId', { required: 'Barbeiro obrigatório' })} className="input-field">
                <option value="">Selecione o barbeiro...</option>
                {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
              {errors.barbeiroId && <p className="text-red-400 text-xs mt-1">{errors.barbeiroId.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Data *</label>
              <input {...register('data', { required: 'Data obrigatória' })} type="date" className="input-field" />
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
                <label key={s.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedServicos.includes(s.id) ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedServicos.includes(s.id)} onChange={() => toggleServico(s.id)} className="accent-amber-500" />
                    <span className="text-sm">{s.nome}</span>
                  </div>
                  <span className="text-xs opacity-70">R$ {s.preco.toFixed(2)}</span>
                </label>
              ))}
            </div>
            {selectedServicos.length > 0 && (
              <p className="text-amber-400 text-sm mt-2">
                Total: R$ {servicos.filter(s => selectedServicos.includes(s.id)).reduce((sum, s) => sum + s.preco, 0).toFixed(2)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
            <textarea {...register('observacoes')} rows={2} className="input-field resize-none" placeholder="Observações..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 py-2.5 rounded-lg font-semibold transition-colors">
              {editing ? 'Salvar' : 'Agendar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal isOpen={statusModal !== null} onClose={() => setStatusModal(null)} title="Alterar Status" size="sm">
        <div className="space-y-3">
          {Object.entries(STATUS_CONFIG).map(([key, { label, cls }]) => (
            <button
              key={key}
              onClick={() => statusModal && updateMutation.mutate({ id: statusModal.id, data: { status: key } })}
              className={`w-full py-3 rounded-lg font-medium border transition-all ${key === statusModal?.status ? cls + ' ring-2 ring-offset-1 ring-offset-gray-800' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'} ${key === statusModal?.status ? cls : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-gray-300 mb-6">Tem certeza que deseja excluir este agendamento?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
