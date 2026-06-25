import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit2, Trash2, Scissors, Phone, Mail, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';

interface Barbeiro {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  especialidade?: string;
  comissao: number;
  ativo: boolean;
  _count?: { agendamentos: number };
}

interface BarbeiroForm {
  nome: string;
  telefone: string;
  email?: string;
  especialidade?: string;
  comissao: number;
  ativo?: boolean;
}

export default function Barbeiros() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Barbeiro | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: barbeiros = [], isLoading } = useQuery<Barbeiro[]>({
    queryKey: ['barbeiros'],
    queryFn: () => api.get('/barbeiros').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<BarbeiroForm>();

  const createMutation = useMutation({
    mutationFn: (data: BarbeiroForm) => api.post('/barbeiros', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['barbeiros'] }); toast.success('Barbeiro cadastrado!'); closeModal(); },
    onError: () => toast.error('Erro ao cadastrar barbeiro'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: BarbeiroForm }) => api.put(`/barbeiros/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['barbeiros'] }); toast.success('Barbeiro atualizado!'); closeModal(); },
    onError: () => toast.error('Erro ao atualizar barbeiro'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/barbeiros/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['barbeiros'] }); toast.success('Barbeiro excluído!'); setDeleteId(null); },
    onError: () => toast.error('Erro ao excluir barbeiro'),
  });

  const openCreate = () => { setEditing(null); reset({ comissao: 50 }); setModalOpen(true); };
  const openEdit = (b: Barbeiro) => {
    setEditing(b);
    reset({ nome: b.nome, telefone: b.telefone, email: b.email || '', especialidade: b.especialidade || '', comissao: b.comissao, ativo: b.ativo });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); reset({}); };
  const onSubmit = (data: BarbeiroForm) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const filtered = barbeiros.filter(b =>
    b.nome.toLowerCase().includes(search.toLowerCase()) ||
    (b.especialidade || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Scissors size={24} className="text-amber-500" />Barbeiros</h1>
          <p className="text-gray-400 text-sm mt-1">{barbeiros.filter(b => b.ativo).length} barbeiro(s) ativo(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />Novo Barbeiro
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar barbeiro..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors" />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-700/50">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Nome</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Especialidade</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Contato</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Comissão</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Status</th>
                  <th className="text-right text-gray-400 text-xs font-medium uppercase px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-12">Nenhum barbeiro encontrado</td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-semibold">{b.nome.charAt(0)}</div>
                        <span className="text-white font-medium">{b.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-300 text-sm">{b.especialidade || <span className="text-gray-600">—</span>}</td>
                    <td className="px-5 py-4 text-gray-300 text-sm">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1"><Phone size={12} className="text-gray-500" />{b.telefone}</div>
                        {b.email && <div className="flex items-center gap-1"><Mail size={12} className="text-gray-500" />{b.email}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-amber-400 font-medium">
                        <Percent size={13} />{b.comissao}%
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${b.ativo ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {b.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteId(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Barbeiro' : 'Novo Barbeiro'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
            <input {...register('nome', { required: 'Nome obrigatório' })} className="input-field" placeholder="Nome completo" />
            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Telefone *</label>
            <input {...register('telefone', { required: 'Telefone obrigatório' })} className="input-field" placeholder="(11) 99999-9999" />
            {errors.telefone && <p className="text-red-400 text-xs mt-1">{errors.telefone.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Especialidade</label>
            <input {...register('especialidade')} className="input-field" placeholder="Ex: Corte Clássico, Degradê..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Comissão (%)</label>
            <input {...register('comissao', { required: true, min: 0, max: 100 })} type="number" min="0" max="100" step="0.5" className="input-field" placeholder="50" />
          </div>
          {editing && (
            <div className="flex items-center gap-3">
              <input {...register('ativo')} type="checkbox" id="ativo" className="w-4 h-4 accent-amber-500" />
              <label htmlFor="ativo" className="text-sm text-gray-300">Barbeiro ativo</label>
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
        <p className="text-gray-300 mb-6">Tem certeza que deseja excluir este barbeiro?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
