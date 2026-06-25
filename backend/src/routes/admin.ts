import { Router, Response } from 'express';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('admin'));

router.post('/cleanup-duplicates', async (_req: AuthRequest, res: Response) => {
  try {
    const stats: Record<string, number> = {};

    // Barbeiros duplicados
    const barbeiros = await prisma.barbeiro.findMany({ orderBy: { id: 'asc' } });
    const keepBarbeiroIds = new Set<number>();
    const seenBarbeiros = new Set<string>();
    for (const b of barbeiros) {
      const key = `${b.nome}|${b.telefone}`;
      if (!seenBarbeiros.has(key)) { seenBarbeiros.add(key); keepBarbeiroIds.add(b.id); }
    }
    const deleteBarbeiroIds = barbeiros.filter(b => !keepBarbeiroIds.has(b.id)).map(b => b.id);
    if (deleteBarbeiroIds.length > 0) {
      await prisma.agendamentoServico.deleteMany({ where: { agendamento: { barbeiroId: { in: deleteBarbeiroIds } } } });
      await prisma.agendamento.deleteMany({ where: { barbeiroId: { in: deleteBarbeiroIds } } });
      await prisma.usuario.updateMany({ where: { barbeiroId: { in: deleteBarbeiroIds } }, data: { barbeiroId: null } });
      await prisma.barbeiro.deleteMany({ where: { id: { in: deleteBarbeiroIds } } });
    }
    stats.barbeiros = deleteBarbeiroIds.length;

    // Clientes duplicados
    const clientes = await prisma.cliente.findMany({ orderBy: { id: 'asc' } });
    const keepClienteIds = new Set<number>();
    const seenClientes = new Set<string>();
    for (const c of clientes) {
      const key = `${c.nome}|${c.telefone}`;
      if (!seenClientes.has(key)) { seenClientes.add(key); keepClienteIds.add(c.id); }
    }
    const deleteClienteIds = clientes.filter(c => !keepClienteIds.has(c.id)).map(c => c.id);
    if (deleteClienteIds.length > 0) {
      await prisma.agendamentoServico.deleteMany({ where: { agendamento: { clienteId: { in: deleteClienteIds } } } });
      await prisma.agendamento.deleteMany({ where: { clienteId: { in: deleteClienteIds } } });
      await prisma.assinatura.deleteMany({ where: { clienteId: { in: deleteClienteIds } } });
      await prisma.reservaProduto.deleteMany({ where: { clienteId: { in: deleteClienteIds } } });
      await prisma.usuario.updateMany({ where: { clienteId: { in: deleteClienteIds } }, data: { clienteId: null } });
      await prisma.cliente.deleteMany({ where: { id: { in: deleteClienteIds } } });
    }
    stats.clientes = deleteClienteIds.length;

    // Produtos duplicados
    const produtos = await prisma.produto.findMany({ orderBy: { id: 'asc' } });
    const keepProdutoIds = new Set<number>();
    const seenProdutos = new Set<string>();
    for (const p of produtos) {
      if (!seenProdutos.has(p.nome)) { seenProdutos.add(p.nome); keepProdutoIds.add(p.id); }
    }
    const deleteProdutoIds = produtos.filter(p => !keepProdutoIds.has(p.id)).map(p => p.id);
    if (deleteProdutoIds.length > 0) {
      await prisma.reservaProduto.deleteMany({ where: { produtoId: { in: deleteProdutoIds } } });
      await prisma.produto.deleteMany({ where: { id: { in: deleteProdutoIds } } });
    }
    stats.produtos = deleteProdutoIds.length;

    // Planos duplicados
    const planos = await prisma.plano.findMany({ orderBy: { id: 'asc' } });
    const keepPlanoIds = new Set<number>();
    const seenPlanos = new Set<string>();
    for (const p of planos) {
      if (!seenPlanos.has(p.nome)) { seenPlanos.add(p.nome); keepPlanoIds.add(p.id); }
    }
    const deletePlanoIds = planos.filter(p => !keepPlanoIds.has(p.id)).map(p => p.id);
    if (deletePlanoIds.length > 0) {
      await prisma.assinatura.deleteMany({ where: { planoId: { in: deletePlanoIds } } });
      await prisma.plano.deleteMany({ where: { id: { in: deletePlanoIds } } });
    }
    stats.planos = deletePlanoIds.length;

    return res.json({ message: 'Limpeza concluída!', removidos: stats });
  } catch (err) {
    console.error('Cleanup error:', err);
    return res.status(500).json({ error: 'Erro na limpeza' });
  }
});

export default router;
