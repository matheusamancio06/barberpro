import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const barbeiros = await prisma.barbeiro.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { agendamentos: true } } }
    });
    return res.json(barbeiros);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar barbeiros' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const barbeiro = await prisma.barbeiro.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        agendamentos: {
          include: { cliente: true, servicos: { include: { servico: true } } },
          orderBy: { data: 'desc' },
          take: 20
        }
      }
    });
    if (!barbeiro) return res.status(404).json({ error: 'Barbeiro não encontrado' });
    return res.json(barbeiro);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar barbeiro' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, telefone, email, especialidade, comissao } = req.body;
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    const barbeiro = await prisma.barbeiro.create({
      data: {
        nome,
        telefone,
        email: email || null,
        especialidade: especialidade || null,
        comissao: comissao ? Number(comissao) : 50
      }
    });
    return res.status(201).json(barbeiro);
  } catch {
    return res.status(500).json({ error: 'Erro ao criar barbeiro' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, telefone, email, especialidade, comissao, ativo } = req.body;
    const barbeiro = await prisma.barbeiro.update({
      where: { id: Number(req.params.id) },
      data: {
        nome,
        telefone,
        email: email || null,
        especialidade: especialidade || null,
        comissao: comissao ? Number(comissao) : undefined,
        ativo: ativo !== undefined ? Boolean(ativo) : undefined
      }
    });
    return res.json(barbeiro);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar barbeiro' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.barbeiro.delete({ where: { id: Number(req.params.id) } });
    return res.json({ message: 'Barbeiro excluído com sucesso' });
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir barbeiro' });
  }
});

export default router;
