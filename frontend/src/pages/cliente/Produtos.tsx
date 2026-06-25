import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, ShoppingBag, XCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import Modal from '../../components/Modal';

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  categoria?: string;
  ativo: boolean;
}

interface Reserva {
  id: number;
  quantidade: number;
  status: string;
  observacoes?: string;
  createdAt: string;
  produto: { id: number; nome: string; preco: number; categoria?: string };
  cliente: { nome: string };
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmado: { label: 'Confirmado', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  retirado: { label: 'Retirado', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelado: { label: 'Cancelado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function ClienteProdutos() {
  const qc = useQueryClient();
  const [reserveProduct, setReserveProduct] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [cancelId, setCancelId] = useState<number | null>(null);

  const { data: produtos = [], isLoading: loadingProdutos } = useQuery<Produto[]>({
    queryKey: ['produtos-ativos'],
    queryFn: () => api.get('/produtos').then(r => r.data.filter((p: Produto) => p.ativo && p.estoque > 0)),
  });

  const { data: reservas = [], isLoading: loadingReservas } = useQuery<Reserva[]>({
    queryKey: ['minhas-reservas'],
    queryFn: () => api.get('/reservas').then(r => r.data),
  });

  const reservaMutation = useMutation({
    mutationFn: (data: { produtoId: number; quantidade: number; observacoes?: string }) =>
      api.post('/reservas', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minhas-reservas'] });
      qc.invalidateQueries({ queryKey: ['produtos-ativos'] });
      toast.success('Produto reservado com sucesso!');
      closeReserveModal();
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao reservar produto'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/reservas/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minhas-reservas'] });
      qc.invalidateQueries({ queryKey: ['produtos-ativos'] });
      toast.success('Reserva cancelada!');
      setCancelId(null);
    },
    onError: () => toast.error('Erro ao cancelar reserva'),
  });

  const openReserve = (p: Produto) => {
    setReserveProduct(p);
    setQuantidade(1);
    setObservacoes('');
  };

  const closeReserveModal = () => { setReserveProduct(null); setQuantidade(1); setObservacoes(''); };

  const handleReserve = () => {
    if (!reserveProduct) return;
    reservaMutation.mutate({ produtoId: reserveProduct.id, quantidade, observacoes: observacoes || undefined });
  };

  const minhasReservasAtivas = reservas.filter(r => r.status !== 'cancelado' && r.status !== 'retirado');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package size={24} className="text-amber-500" />Produtos
        </h1>
        <p className="text-gray-400 text-sm mt-1">Reserve produtos da barbearia</p>
      </div>

      {/* Products Grid */}
      {loadingProdutos ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : produtos.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center text-gray-500">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum produto disponível no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map(p => (
            <div key={p.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors">
              <div className="h-32 bg-gray-700/50 flex items-center justify-center">
                <Package size={48} className="text-gray-600" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-white font-semibold">{p.nome}</p>
                  {p.categoria && (
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0">{p.categoria}</span>
                  )}
                </div>
                {p.descricao && <p className="text-gray-400 text-sm mb-3">{p.descricao}</p>}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-green-400 font-bold text-xl">R$ {p.preco.toFixed(2)}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${p.estoque <= 3 ? 'text-red-400' : p.estoque <= 10 ? 'text-amber-400' : 'text-gray-400'}`}>
                    {p.estoque <= 3 && <AlertTriangle size={12} />}
                    {p.estoque} em estoque
                  </div>
                </div>
                <button
                  onClick={() => openReserve(p)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  Reservar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Reservations */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl">
        <div className="p-5 border-b border-gray-700 flex items-center gap-2">
          <ShoppingBag size={18} className="text-amber-500" />
          <h2 className="text-white font-semibold">Minhas Reservas</h2>
          {minhasReservasAtivas.length > 0 && (
            <span className="bg-amber-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">{minhasReservasAtivas.length}</span>
          )}
        </div>
        {loadingReservas ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : reservas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhuma reserva ainda</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {reservas.map(r => {
              const statusCfg = STATUS_CONFIG[r.status] || { label: r.status, cls: '' };
              const canCancel = r.status === 'pendente';
              return (
                <div key={r.id} className="p-4 flex items-center gap-4 hover:bg-gray-700/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{r.produto.nome}</p>
                    <p className="text-gray-400 text-sm">
                      {r.quantidade}x · R$ {(r.produto.preco * r.quantidade).toFixed(2)}
                      <span className="text-gray-600 mx-1">·</span>
                      {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    {r.observacoes && <p className="text-gray-500 text-xs italic">{r.observacoes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.cls}`}>
                      {statusCfg.label}
                    </span>
                    {canCancel && (
                      <button
                        onClick={() => setCancelId(r.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Cancelar reserva"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reserve Modal */}
      <Modal isOpen={reserveProduct !== null} onClose={closeReserveModal} title="Reservar Produto" size="sm">
        {reserveProduct && (
          <div className="space-y-4">
            <div className="bg-gray-700/50 rounded-xl p-4">
              <p className="text-white font-semibold">{reserveProduct.nome}</p>
              <p className="text-green-400 font-bold text-lg">R$ {reserveProduct.preco.toFixed(2)}</p>
              {reserveProduct.descricao && <p className="text-gray-400 text-sm mt-1">{reserveProduct.descricao}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Quantidade</label>
              <input
                type="number" min="1" max={reserveProduct.estoque} value={quantidade}
                onChange={e => setQuantidade(Math.max(1, Math.min(reserveProduct.estoque, Number(e.target.value))))}
                className="input-field"
              />
              <p className="text-gray-500 text-xs mt-1">{reserveProduct.estoque} disponíveis</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Observações</label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={2} className="input-field resize-none" placeholder="Observações opcionais..."
              />
            </div>
            <div className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Total</span>
              <span className="text-green-400 font-bold">R$ {(reserveProduct.preco * quantidade).toFixed(2)}</span>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={closeReserveModal} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
              <button onClick={handleReserve} disabled={reservaMutation.isPending} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-900 py-2.5 rounded-lg font-semibold transition-colors">
                {reservaMutation.isPending ? 'Reservando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Reservation Modal */}
      <Modal isOpen={cancelId !== null} onClose={() => setCancelId(null)} title="Cancelar Reserva" size="sm">
        <p className="text-gray-300 mb-6">Tem certeza que deseja cancelar esta reserva? O estoque será restaurado.</p>
        <div className="flex gap-3">
          <button onClick={() => setCancelId(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors">Voltar</button>
          <button onClick={() => cancelId && cancelMutation.mutate(cancelId)} disabled={cancelMutation.isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold transition-colors">
            Cancelar Reserva
          </button>
        </div>
      </Modal>
    </div>
  );
}
