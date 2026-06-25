import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';

interface Reserva {
  id: number;
  quantidade: number;
  status: string;
  observacoes?: string;
  createdAt: string;
  produto: { id: number; nome: string; preco: number; categoria?: string };
  cliente: { id: number; nome: string; telefone: string };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmado: { label: 'Confirmado', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  retirado: { label: 'Retirado', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function Reservas() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('');
  const [statusModal, setStatusModal] = useState<{ id: number; status: string } | null>(null);

  const { data: reservas = [], isLoading } = useQuery<Reserva[]>({
    queryKey: ['reservas'],
    queryFn: () => api.get('/reservas').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/reservas/${id}`, { status }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reservas'] }); toast.success('Status atualizado!'); setStatusModal(null); },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const filtered = reservas.filter(r => !filterStatus || r.status === filterStatus);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={24} className="text-amber-500" />Reservas de Produtos
          </h1>
          <p className="text-gray-400 text-sm mt-1">{filtered.length} reserva(s)</p>
        </div>
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
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Cliente</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Produto</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Qtd</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Total</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Status</th>
                  <th className="text-left text-gray-400 text-xs font-medium uppercase px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-gray-500 py-12">Nenhuma reserva encontrada</td></tr>
                ) : filtered.map(r => {
                  const statusCfg = STATUS_CONFIG[r.status] || { label: r.status, cls: '' };
                  return (
                    <tr key={r.id} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{r.cliente.nome}</p>
                        <p className="text-gray-400 text-xs">{r.cliente.telefone}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-white font-medium">{r.produto.nome}</p>
                        {r.produto.categoria && <p className="text-gray-400 text-xs">{r.produto.categoria}</p>}
                      </td>
                      <td className="px-5 py-4 text-gray-300">{r.quantidade}</td>
                      <td className="px-5 py-4 text-green-400 font-semibold">
                        R$ {(r.produto.preco * r.quantidade).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setStatusModal({ id: r.id, status: r.status })}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${statusCfg.cls}`}
                        >
                          {statusCfg.label}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-sm">{formatDate(r.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Modal */}
      <Modal isOpen={statusModal !== null} onClose={() => setStatusModal(null)} title="Alterar Status da Reserva" size="sm">
        <div className="space-y-3">
          {Object.entries(STATUS_CONFIG).map(([key, { label, cls }]) => (
            <button
              key={key}
              onClick={() => statusModal && updateMutation.mutate({ id: statusModal.id, status: key })}
              disabled={updateMutation.isPending}
              className={`w-full py-3 rounded-lg font-medium border transition-all disabled:opacity-50 ${key === statusModal?.status ? cls + ' ring-2 ring-offset-1 ring-offset-gray-800' : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
