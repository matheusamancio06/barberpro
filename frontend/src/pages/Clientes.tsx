import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit2, Trash2, Users, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  dataNascimento?: string;
  observacoes?: string;
  _count?: { agendamentos: number };
}

interface ClienteForm {
  nome: string;
  telefone: string;
  email?: string;
  dataNascimento?: string;
  observacoes?: string;
}

export default function Clientes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: clientes = [], isLoading } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: () => api.get('/clientes').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClienteForm>();

  const createMutation = useMutation({
    mutationFn: (data: ClienteForm) => api.post('/clientes', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente cadastrado!'); closeModal(); },
    onError: () => toast.error('Erro ao cadastrar cliente'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClienteForm }) => api.put(`/clientes/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente atualizado!'); closeModal(); },
    onError: () => toast.error('Erro ao atualizar cliente'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/clientes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientes'] }); toast.success('Cliente excluído!'); setDeleteId(null); },
    onError: () => toast.error('Erro ao excluir cliente'),
  });

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (c: Cliente) => {
    setEditing(c);
    reset({
      nome: c.nome, telefone: c.telefone, email: c.email || '',
      dataNascimento: c.dataNascimento ? c.dataNascimento.split('T')[0] : '',
      observacoes: c.observacoes || ''
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditing(null); reset({}); };

  const onSubmit = (data: ClienteForm) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users size={24} className="text-amber-500" />Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Table */}
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
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Telefone</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Email</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Agendamentos</th>
                  <th className="text-right text-gray-400 text-xs font-medium uppercase px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-12">Nenhum cliente encontrado</td></tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-semibold text-sm">{c.nome.charAt(0)}</div>
                        <span className="text-white font-medium">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-300 text-sm">
                      <div className="flex items-center gap-1"><Phone size={13} className="text-gray-500" />{c.telefone}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-300 text-sm">
                      {c.email ? <div className="flex items-center gap-1"><Mail size={13} className="text-gray-500" />{c.email}</div> : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">{c._count?.agendamentos || 0}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Cliente' : 'Novo Cliente'}>
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Data de Nascimento</label>
            <input {...register('dataNascimento')} type="date" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
            <textarea {...register('observacoes')} rows={3} className="input-field resize-none" placeholder="Observações sobre o cliente..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 py-2.5 rounded-lg font-semibold transition-colors">
              {editing ? 'Salvar' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-gray-300 mb-6">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
