import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const include = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  barbeiro: { select: { id: true, nome: true } },
  servicos: { include: { servico: true } }
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { data, status, barbeiroId: qBarb, clienteId: qClient } = req.query;
    const where: Record<string, unknown> = {};

    if (req.user?.role === 'cliente') {
      where.clienteId = req.user.clienteId;
    } else if (req.user?.role === 'barbeiro') {
      where.barbeiroId = req.user.barbeiroId;
    } else {
      if (qBarb) where.barbeiroId = Number(qBarb);
      if (qClient) where.clienteId = Number(qClient);
    }

    if (status) where.status = status;

    if (data) {
      const d = new Date(data as string);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      where.data = { gte: d, lte: end };
    }

    const agendamentos = await prisma.agendamento.findMany({ where, include, orderBy: { data: 'asc' } });
    return res.json(agendamentos);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { clienteId, barbeiroId, data, observacoes, servicoIds = [] } = req.body;

    let finalClienteId = Number(clienteId);
    if (req.user?.role === 'cliente') {
      finalClienteId = req.user.clienteId!;
    }

    const servicos = await prisma.servico.findMany({ where: { id: { in: servicoIds.map(Number) } } });
    const total = servicos.reduce((sum: number, s: { preco: number }) => sum + s.preco, 0);

    const agendamento = await prisma.agendamento.create({
      data: {
        clienteId: finalClienteId,
        barbeiroId: Number(barbeiroId),
        data: new Date(data),
        observacoes,
        total,
        servicos: {
          create: servicos.map((s: { id: number; preco: number }) => ({ servicoId: s.id, preco: s.preco }))
        }
      },
      include
    });
    return res.status(201).json(agendamento);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const ag = await prisma.agendamento.findUnique({ where: { id: Number(req.params.id) }, include });
    if (!ag) return res.status(404).json({ error: 'Não encontrado' });
    return res.json(ag);
  } catch {
    return res.status(500).json({ error: 'Erro' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { clienteId, barbeiroId, data, observacoes, servicoIds, status } = req.body;
    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (observacoes !== undefined) updateData.observacoes = observacoes;
    if (data) updateData.data = new Date(data);
    if (barbeiroId && req.user?.role !== 'barbeiro') updateData.barbeiroId = Number(barbeiroId);
    if (clienteId && req.user?.role === 'admin') updateData.clienteId = Number(clienteId);

    if (servicoIds !== undefined) {
      const servicos = await prisma.servico.findMany({ where: { id: { in: servicoIds.map(Number) } } });
      const total = servicos.reduce((sum: number, s: { preco: number }) => sum + s.preco, 0);
      updateData.total = total;
      await prisma.agendamentoServico.deleteMany({ where: { agendamentoId: Number(req.params.id) } });
      await prisma.agendamentoServico.createMany({
        data: servicos.map((s: { id: number; preco: number }) => ({ agendamentoId: Number(req.params.id), servicoId: s.id, preco: s.preco }))
      });
    }

    const ag = await prisma.agendamento.update({ where: { id: Number(req.params.id) }, data: updateData, include });
    return res.json(ag);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao atualizar' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.agendamentoServico.deleteMany({ where: { agendamentoId: Number(req.params.id) } });
    await prisma.agendamento.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir' });
  }
});

export default router;
