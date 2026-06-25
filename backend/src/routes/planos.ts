import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

// Deve vir antes de /:id para não ser capturado como id
router.get('/minhas-assinaturas', async (req: AuthRequest, res: Response) => {
  try {
    const clienteId = req.user?.clienteId;
    if (!clienteId) return res.json([]);
    const assinaturas = await prisma.assinatura.findMany({
      where: { clienteId },
      include: { plano: true },
      orderBy: { dataInicio: 'desc' },
    });
    return res.json(assinaturas);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar assinaturas' });
  }
});

router.post('/:id/assinar', async (req: AuthRequest, res: Response) => {
  try {
    const clienteId = req.user?.clienteId;
    if (!clienteId) return res.status(400).json({ error: 'Usuário não é um cliente' });
    const plano = await prisma.plano.findUnique({ where: { id: Number(req.params.id) } });
    if (!plano || !plano.ativo) return res.status(404).json({ error: 'Plano não encontrado' });
    await prisma.assinatura.updateMany({ where: { clienteId, ativo: true }, data: { ativo: false } });
    const dataInicio = new Date();
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + plano.duracao);
    const assinatura = await prisma.assinatura.create({
      data: { clienteId, planoId: plano.id, dataInicio, dataFim, ativo: true },
      include: { plano: true },
    });
    return res.status(201).json(assinatura);
  } catch {
    return res.status(500).json({ error: 'Erro ao assinar plano' });
  }
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const planos = await prisma.plano.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { assinaturas: true } } }
    });
    return res.json(planos);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar planos' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const plano = await prisma.plano.findUnique({
      where: { id: Number(req.params.id) },
      include: { assinaturas: { include: { cliente: true } } }
    });
    if (!plano) return res.status(404).json({ error: 'Plano não encontrado' });
    return res.json(plano);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar plano' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao, preco, duracao, servicos } = req.body;
    if (!nome || preco === undefined || !duracao) {
      return res.status(400).json({ error: 'Nome, preço e duração são obrigatórios' });
    }
    const plano = await prisma.plano.create({
      data: {
        nome,
        descricao: descricao || null,
        preco: Number(preco),
        duracao: Number(duracao),
        servicos: JSON.stringify(servicos || [])
      }
    });
    return res.status(201).json(plano);
  } catch {
    return res.status(500).json({ error: 'Erro ao criar plano' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao, preco, duracao, servicos, ativo } = req.body;
    const plano = await prisma.plano.update({
      where: { id: Number(req.params.id) },
      data: {
        nome,
        descricao: descricao || null,
        preco: preco !== undefined ? Number(preco) : undefined,
        duracao: duracao !== undefined ? Number(duracao) : undefined,
        servicos: servicos !== undefined ? JSON.stringify(servicos) : undefined,
        ativo: ativo !== undefined ? Boolean(ativo) : undefined
      }
    });
    return res.json(plano);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.plano.delete({ where: { id: Number(req.params.id) } });
    return res.json({ message: 'Plano excluído com sucesso' });
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir plano' });
  }
});

export default router;
