import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Users, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  clienteId?: number;
  barbeiroId?: number;
  createdAt: string;
}

interface UsuarioForm {
  nome: string;
  email: string;
  senha?: string;
  role: string;
  ativo?: boolean;
  telefone?: string;
  clienteId?: number;
  barbeiroId?: number;
}

const ROLE_CONFIG: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  barbeiro: { label: 'Barbeiro', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  cliente: { label: 'Cliente', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

export default function Usuarios() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: usuarios = [], isLoading } = useQuery<Usuario[]>({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then(r => r.data),
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UsuarioForm>();
  const watchRole = watch('role');

  const createMutation = useMutation({
    mutationFn: (data: UsuarioForm) => api.post('/auth/criar-conta', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuário criado!'); closeModal(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao criar usuário'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UsuarioForm }) => api.put(`/usuarios/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuário atualizado!'); closeModal(); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao atualizar usuário'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/usuarios/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuário excluído!'); setDeleteId(null); },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao excluir usuário'),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ role: 'cliente', ativo: true });
    setModalOpen(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    reset({ nome: u.nome, email: u.email, role: u.role, ativo: u.ativo, clienteId: u.clienteId, barbeiroId: u.barbeiroId });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); reset({}); };

  const onSubmit = (data: UsuarioForm) => {
    if (!data.senha) delete data.senha;
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck size={24} className="text-amber-500" />Usuários
          </h1>
          <p className="text-gray-400 text-sm mt-1">{usuarios.length} usuário(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />Novo Usuário
        </button>
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
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Usuário</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Role</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Status</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Vínculo</th>
                  <th className="text-right text-gray-400 text-xs font-medium uppercase px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usuarios.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 py-12">Nenhum usuário encontrado</td></tr>
                ) : usuarios.map(u => {
                  const roleCfg = ROLE_CONFIG[u.role] || { label: u.role, cls: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
                  return (
                    <tr key={u.id} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm">
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{u.nome}</p>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${roleCfg.cls}`}>
                          {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${u.ativo ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-sm">
                        {u.clienteId ? `Cliente #${u.clienteId}` : u.barbeiroId ? `Barbeiro #${u.barbeiroId}` : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
            <input {...register('nome', { required: 'Nome obrigatório' })} className="input-field" placeholder="Nome completo" />
            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">E-mail *</label>
            <input {...register('email', { required: 'E-mail obrigatório' })} type="email" className="input-field" placeholder="usuario@email.com" />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">{editing ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label>
            <input {...register('senha', { required: !editing ? 'Senha obrigatória' : false, minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} type="password" className="input-field" placeholder="••••••••" />
            {errors.senha && <p className="text-red-400 text-xs mt-1">{errors.senha.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
            <select {...register('role', { required: 'Role obrigatória' })} className="input-field">
              <option value="cliente">Cliente</option>
              <option value="barbeiro">Barbeiro</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {!editing && watchRole === 'cliente' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
              <input {...register('telefone')} type="tel" className="input-field" placeholder="(11) 99999-9999" />
            </div>
          )}
          {editing && (
            <>
              <div className="flex items-center gap-3">
                <input {...register('ativo')} type="checkbox" id="ativoU" className="w-4 h-4 accent-amber-500" />
                <label htmlFor="ativoU" className="text-sm text-gray-300">Usuário ativo</label>
              </div>
              {watchRole === 'barbeiro' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">ID do Barbeiro</label>
                  <input {...register('barbeiroId')} type="number" className="input-field" placeholder="ID do barbeiro vinculado" />
                </div>
              )}
              {watchRole === 'cliente' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">ID do Cliente</label>
                  <input {...register('clienteId')} type="number" className="input-field" placeholder="ID do cliente vinculado" />
                </div>
              )}
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={closeModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 py-2.5 rounded-lg font-semibold transition-colors">
              {editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmar Exclusão" size="sm">
        <p className="text-gray-300 mb-6">Tem certeza que deseja excluir este usuário?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
