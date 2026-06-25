import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Calendar, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface Plano {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  duracao: number;
  servicos: string;
  ativo: boolean;
}

interface Assinatura {
  id: number;
  ativo: boolean;
  dataFim: string;
  plano: Plano;
}

interface Servico { id: number; nome: string; }

export default function ClientePlanos() {
  const qc = useQueryClient();

  const { data: planos = [], isLoading } = useQuery<Plano[]>({
    queryKey: ['planos'],
    queryFn: () => api.get('/planos').then(r => r.data),
  });

  const { data: assinaturas = [] } = useQuery<Assinatura[]>({
    queryKey: ['minhas-assinaturas'],
    queryFn: () => api.get('/planos/minhas-assinaturas').then(r => r.data),
    retry: false,
  });

  const { data: servicos = [] } = useQuery<Servico[]>({
    queryKey: ['servicos'],
    queryFn: () => api.get('/servicos').then(r => r.data),
  });

  const assinarMutation = useMutation({
    mutationFn: (planoId: number) => api.post(`/planos/${planoId}/assinar`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['minhas-assinaturas'] });
      toast.success('Plano assinado com sucesso!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao assinar plano'),
  });

  const now = new Date();
  const assinaturaAtiva = assinaturas.find(a => a.ativo && new Date(a.dataFim) >= now);
  const ativosPlanos = planos.filter(p => p.ativo);

  const getServicoNames = (servicosJson: string) => {
    try {
      const ids: number[] = JSON.parse(servicosJson);
      return ids.map(id => servicos.find(s => s.id === id)?.nome).filter(Boolean) as string[];
    } catch { return []; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard size={24} className="text-amber-500" />Planos de Assinatura
        </h1>
        <p className="text-gray-400 text-sm mt-1">Escolha o plano ideal para você</p>
      </div>

      {assinaturaAtiva && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center gap-3">
          <Check size={20} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-amber-400 font-semibold">Plano Ativo: {assinaturaAtiva.plano.nome}</p>
            <p className="text-gray-400 text-sm">
              Válido até {new Date(assinaturaAtiva.dataFim).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : ativosPlanos.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-gray-800 border border-gray-700 rounded-xl">
          <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum plano disponível no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ativosPlanos.map(p => {
            const isAtivo = assinaturaAtiva?.plano.id === p.id;
            const servicoNomes = getServicoNames(p.servicos);
            return (
              <div
                key={p.id}
                className={`bg-gray-800 border rounded-xl p-6 flex flex-col gap-4 ${
                  isAtivo ? 'border-amber-500' : 'border-gray-700'
                }`}
              >
                {isAtivo && (
                  <span className="text-amber-400 text-xs font-semibold flex items-center gap-1">
                    <Check size={13} />Plano atual
                  </span>
                )}
                <div>
                  <h3 className="text-white font-bold text-xl">{p.nome}</h3>
                  {p.descricao && <p className="text-gray-400 text-sm mt-1">{p.descricao}</p>}
                </div>
                <div className="text-3xl font-bold text-amber-400">
                  R$ {p.preco.toFixed(2)}
                  <span className="text-gray-500 text-sm font-normal ml-1">/{p.duracao} dias</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Calendar size={14} />{p.duracao} dias de duração
                </div>
                {servicoNomes.length > 0 && (
                  <ul className="space-y-1 flex-1">
                    {servicoNomes.map(nome => (
                      <li key={nome} className="flex items-center gap-2 text-gray-300 text-sm">
                        <Check size={13} className="text-green-400 flex-shrink-0" />{nome}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  onClick={() => !isAtivo && assinarMutation.mutate(p.id)}
                  disabled={isAtivo || assinarMutation.isPending}
                  className={`w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mt-auto ${
                    isAtivo
                      ? 'bg-amber-500/20 text-amber-400 cursor-default'
                      : 'bg-amber-500 hover:bg-amber-600 text-gray-900 disabled:opacity-50'
                  }`}
                >
                  {assinarMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isAtivo ? 'Plano Atual' : 'Assinar Plano'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
