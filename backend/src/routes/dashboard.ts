import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    const [
      agendamentosHoje,
      agendamentosPendentes,
      totalClientes,
      totalBarbeiros,
      receitaHoje,
      receitaMes,
      proximosAgendamentos,
      agendamentosRecentes
    ] = await Promise.all([
      prisma.agendamento.count({ where: { data: { gte: inicioHoje, lte: fimHoje } } }),
      prisma.agendamento.count({ where: { status: 'agendado', data: { gte: inicioHoje } } }),
      prisma.cliente.count(),
      prisma.barbeiro.count({ where: { ativo: true } }),
      prisma.agendamento.aggregate({
        where: { data: { gte: inicioHoje, lte: fimHoje }, status: 'concluido' },
        _sum: { total: true }
      }),
      prisma.agendamento.aggregate({
        where: { data: { gte: inicioMes, lte: fimMes }, status: 'concluido' },
        _sum: { total: true }
      }),
      prisma.agendamento.findMany({
        where: { data: { gte: new Date() }, status: 'agendado' },
        orderBy: { data: 'asc' },
        take: 5,
        include: { cliente: true, barbeiro: true, servicos: { include: { servico: true } } }
      }),
      prisma.agendamento.findMany({
        where: { data: { gte: inicioHoje, lte: fimHoje } },
        orderBy: { data: 'asc' },
        include: { cliente: true, barbeiro: true, servicos: { include: { servico: true } } }
      })
    ]);

    return res.json({
      agendamentosHoje,
      agendamentosPendentes,
      totalClientes,
      totalBarbeiros,
      receitaHoje: receitaHoje._sum.total || 0,
      receitaMes: receitaMes._sum.total || 0,
      proximosAgendamentos,
      agendamentosHojeDetalhes: agendamentosRecentes
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

export default router;
