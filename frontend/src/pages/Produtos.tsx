import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import Modal from '../components/Modal';

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoria?: string;
  ativo: boolean;
}

interface ProdutoForm {
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoria?: string;
  ativo?: boolean;
}

const CATEGORIAS = ['Cabelo', 'Barba', 'Pele', 'Acessórios', 'Ferramentas', 'Outros'];

export default function Produtos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: produtos = [], isLoading } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: () => api.get('/produtos').then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProdutoForm>();

  const createMutation = useMutation({
    mutationFn: (data: ProdutoForm) => api.post('/produtos', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['produtos'] }); toast.success('Produto cadastrado!'); closeModal(); },
    onError: () => toast.error('Erro ao cadastrar produto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProdutoForm }) => api.put(`/produtos/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['produtos'] }); toast.success('Produto atualizado!'); closeModal(); },
    onError: () => toast.error('Erro ao atualizar produto'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/produtos/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['produtos'] }); toast.success('Produto excluído!'); setDeleteId(null); },
    onError: () => toast.error('Erro ao excluir produto'),
  });

  const openCreate = () => { setEditing(null); reset({ estoque: 0 }); setModalOpen(true); };
  const openEdit = (p: Produto) => { setEditing(p); reset({ nome: p.nome, descricao: p.descricao || '', preco: p.preco, estoque: p.estoque, categoria: p.categoria || '', ativo: p.ativo }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); reset({}); };
  const onSubmit = (data: ProdutoForm) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const filtered = produtos.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package size={24} className="text-amber-500" />Produtos</h1>
          <p className="text-gray-400 text-sm mt-1">{produtos.length} produto(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar produto ou categoria..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 transition-colors" />
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-700/50">
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Produto</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Categoria</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Preço</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Estoque</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Status</th>
                  <th className="text-right text-gray-400 text-xs font-medium uppercase px-5 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-12">Nenhum produto encontrado</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-700/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center"><Package size={14} className="text-purple-400" /></div>
                        <div>
                          <p className="text-white font-medium">{p.nome}</p>
                          {p.descricao && <p className="text-gray-500 text-xs">{p.descricao}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {p.categoria ? (
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">{p.categoria}</span>
                      ) : <span className="text-gray-600">—</span>}
                    </td>
                    <td className="px-5 py-4 text-green-400 font-semibold">R$ {p.preco.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1 text-sm font-medium ${p.estoque <= 3 ? 'text-red-400' : p.estoque <= 10 ? 'text-amber-400' : 'text-gray-300'}`}>
                        {p.estoque <= 3 && <AlertTriangle size={13} />}
                        {p.estoque} un
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${p.ativo ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 size={15} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nome *</label>
            <input {...register('nome', { required: 'Nome obrigatório' })} className="input-field" placeholder="Nome do produto" />
            {errors.nome && <p className="text-red-400 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
            <textarea {...register('descricao')} rows={2} className="input-field resize-none" placeholder="Descrição do produto..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preço (R$) *</label>
              <input {...register('preco', { required: 'Preço obrigatório' })} type="number" step="0.01" min="0" className="input-field" placeholder="0.00" />
              {errors.preco && <p className="text-red-400 text-xs mt-1">{errors.preco.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Estoque</label>
              <input {...register('estoque')} type="number" min="0" className="input-field" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
            <select {...register('categoria')} className="input-field">
              <option value="">Selecione...</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {editing && (
            <div className="flex items-center gap-3">
              <input {...register('ativo')} type="checkbox" id="ativoP" className="w-4 h-4 accent-amber-500" />
              <label htmlFor="ativoP" className="text-sm text-gray-300">Produto ativo</label>
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
        <p className="text-gray-300 mb-6">Tem certeza que deseja excluir este produto?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
          <button onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">Excluir</button>
        </div>
      </Modal>
    </div>
  );
}
