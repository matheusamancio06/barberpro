import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { nome: 'asc' },
      include: { _count: { select: { agendamentos: true } } }
    });
    return res.json(clientes);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        agendamentos: {
          include: { barbeiro: true, servicos: { include: { servico: true } } },
          orderBy: { data: 'desc' }
        },
        assinaturas: { include: { plano: true } }
      }
    });
    if (!cliente) return res.status(404).json({ error: 'Cliente não encontrado' });
    return res.json(cliente);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, telefone, email, dataNascimento, observacoes } = req.body;
    if (!nome || !telefone) {
      return res.status(400).json({ error: 'Nome e telefone são obrigatórios' });
    }
    const cliente = await prisma.cliente.create({
      data: {
        nome,
        telefone,
        email: email || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        observacoes: observacoes || null
      }
    });
    return res.status(201).json(cliente);
  } catch {
    return res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, telefone, email, dataNascimento, observacoes } = req.body;
    const cliente = await prisma.cliente.update({
      where: { id: Number(req.params.id) },
      data: {
        nome,
        telefone,
        email: email || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        observacoes: observacoes || null
      }
    });
    return res.json(cliente);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cliente.delete({ where: { id: Number(req.params.id) } });
    return res.json({ message: 'Cliente excluído com sucesso' });
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir cliente' });
  }
});

export default router;
