import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get reservas - admin/barbeiro see all, cliente sees own
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const where: Record<string, unknown> = req.user?.role === 'cliente' ? { clienteId: req.user.clienteId } : {};
    const reservas = await prisma.reservaProduto.findMany({
      where,
      include: { produto: true, cliente: true },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(reservas);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar reservas' });
  }
});

// Create reserva (cliente only)
router.post('/', requireRole('cliente'), async (req: AuthRequest, res: Response) => {
  try {
    const { produtoId, quantidade = 1, observacoes } = req.body;
    if (!produtoId) return res.status(400).json({ error: 'Produto obrigatório' });
    if (!req.user?.clienteId) return res.status(400).json({ error: 'Cliente não vinculado' });

    const produto = await prisma.produto.findUnique({ where: { id: Number(produtoId) } });
    if (!produto || produto.estoque < quantidade) {
      return res.status(400).json({ error: 'Produto sem estoque suficiente' });
    }

    const reserva = await prisma.reservaProduto.create({
      data: { produtoId: Number(produtoId), clienteId: req.user.clienteId, quantidade: Number(quantidade), observacoes },
      include: { produto: true, cliente: true }
    });

    await prisma.produto.update({ where: { id: Number(produtoId) }, data: { estoque: { decrement: quantidade } } });

    return res.status(201).json(reserva);
  } catch {
    return res.status(500).json({ error: 'Erro ao criar reserva' });
  }
});

// Update status (admin/barbeiro)
router.put('/:id', requireRole('admin', 'barbeiro'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const reserva = await prisma.reservaProduto.update({
      where: { id: Number(req.params.id) },
      data: { status },
      include: { produto: true, cliente: true }
    });

    // If cancelled, restore stock
    if (status === 'cancelado') {
      await prisma.produto.update({ where: { id: reserva.produtoId }, data: { estoque: { increment: reserva.quantidade } } });
    }

    return res.json(reserva);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar reserva' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const reserva = await prisma.reservaProduto.findUnique({ where: { id: Number(req.params.id) } });
    if (!reserva) return res.status(404).json({ error: 'Reserva não encontrada' });

    // Only owner or admin can cancel
    if (req.user?.role === 'cliente' && reserva.clienteId !== req.user.clienteId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.reservaProduto.delete({ where: { id: Number(req.params.id) } });
    await prisma.produto.update({ where: { id: reserva.produtoId }, data: { estoque: { increment: reserva.quantidade } } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Erro ao cancelar reserva' });
  }
});

export default router;
