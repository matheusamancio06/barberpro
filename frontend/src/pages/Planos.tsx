import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit2, Trash2, CreditCard, Calendar, DollarSign, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';

interface Plano {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  duracao: number;
  servicos: string;
  ativo: boolean;
  _count?: { assinaturas: number };
}

interface Servico {
  id: number;
  nome: string;
  preco: number;
}

interface PlanoForm {
  nome: string;
  descricao?: string;
  preco: number;
  duracao: number;
  ativo?: boolean;
}

export default function Planos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedServicos, setSelectedServicos] = useState<number[]>([]);

  const { data: planos = [], isLoading } = useQuery<Plano[]>({
    queryKey: ['planos'],
    queryFn: () => api.get('/planos').then(r => r.data),
  });

  const { data: servicos = [] } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: () => api.get('/servicos').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanoForm>();

  const createMutation = useMutation({
    mutationFn: (data: PlanoForm & { servicos: number[] }) => api.post('/planos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planos'] }); toast.success('Plano cadastrado!'); closeModal(); },
    onError: () => toast.error('Erro ao cadastrar plano'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PlanoForm & { servicos: number[] } }) => api.put(`/planos/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planos'] }); toast.success('Plano atualizado!'); closeModal(); },
    onError: () => toast.error('Erro ao atualizar plano'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/planos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['planos'] }); toast.success('Plano excluído!'); setDeleteId(null); },
    onError: () => toast.error('Erro ao excluir plano'),
  });

  const openCreate = () => { setEditing(null); reset({ duracao: 30 }); setSelectedServicos([]); setModalOpen(true); };
  const openEdit = (p: Plano) => {
    setEditing(p);
    reset({ nome: p.nome, descricao: p.descricao || '', preco: p.preco, duracao: p.duracao, ativo: p.ativo });
    try { setSelectedServicos(JSON.parse(p.servicos) || []); } catch { setSelectedServicos([]); }
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); reset({}); setSelectedServicos([]); };

  const toggleServico = (id: number) => {
    setSelectedServicos(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const onSubmit = (data: PlanoForm) => {
    const payload = { ...data, servicos: selectedServicos };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const getServicoNames = (servicosJson: string) => {
    try {
      const ids: number[] = JSON.parse(servicosJson);
      return ids.map(id => servicos.find(s => s.id === id)?.nome).filter(Boolean).join(', ');
    } catch { return ''; }
  };

  const filtered = planos.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard size={24} className="text-amber-500" />Planos</h1>
          <p className="text-gray-400 text-sm mt-1">{planos.filter(p => p.ativo).length} plano(s) ativo(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />Novo Plano
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar plano..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors" />
      </div>

      {/* Cards view */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center text-gray-500 py-16 bg-gray-800 border border-gray-700 rounded-xl">Nenhum plano encontrado</div>
          ) : filtered.map(p => (
            <div key={p.id} className={`bg-gray-800 border rounded-xl p-6 space-y-4 ${p.ativo ? 'border-gray-700' : 'border-gray-700/50 opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg">{p.nome}</h3>
                  {p.descricao && <p className="text-gray-400 text-sm mt-0.5">{p.descricao}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${p.ativo ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                  {p.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="text-3xl font-bold text-amber-400">
                R$ {p.preco.toFixed(2)}
                <span className="text-gray-500 text-sm font-normal ml-1">/{p.duracao} dias</span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={14} /><span>{p.duracao} dias de duração</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users size={14} /><span>{p._count?.assinaturas || 0} assinante(s)</span>
                </div>
                {getServicoNames(p.servicos) && (
                  <div className="text-gray-400 text-xs mt-2">
                    <span className="text-gray-500">Serviços: </span>{getServicoNames(p.servicos)}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-700">
                <button onClick={() => openEdit(p)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors text-sm">
                  <Edit2 size={14} />Editar
                </button>
                <button onClick={() => setDeleteId(p.id)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                  <Trash2 size={14} />Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Plano' : 'Novo Plano'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
            <input {...register('nome', { required: 'Nome obrigatório' })} className="input-field" placeholder="Ex: Plano Premium" />
            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <textarea {...register('descricao')} rows={2} className="input-field resize-none" placeholder="Descrição do plano..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preço (R$) *</label>
              <input {...register('preco', { required: 'Preço obrigatório' })} type="number" step="0.01" min="0" className="input-field" placeholder="0.00" />
              {errors.preco && <p className="text-red-400 text-xs mt-1">{errors.preco.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Duração (dias) *</label>
              <input {...register('duracao', { required: 'Duração obrigatória' })} type="number" min="1" className="input-field" placeholder="30" />
              {errors.duracao && <p className="text-red-400 text-xs mt-1">{errors.duracao.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Serviços Incluídos</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {servicos.map(s => (
                <label key={s.id} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${selectedServicos.includes(s.id) ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700'}`}>
                  <input type="checkbox" checked={selectedServicos.includes(s.id)} onChange={() => toggleServico(s.id)} className="accent-amber-500" />
                  <span className="text-sm">{s.nome}</span>
                </label>
              ))}
            </div>
          </div>
          {editing && (
            <div className="flex items-center gap-3">
              <input {...register('ativo')} type="checkbox" id="ativoPlano" className="w-4 h-4 accent-amber-500" />
              <label htmlFor="ativoPlano" className="text-sm text-gray-300">Plano ativo</label>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 py-2.5 rounded-lg font-semibold transition-colors">
              {editing ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-gray-300 mb-6">Tem certeza que deseja excluir este plano?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
