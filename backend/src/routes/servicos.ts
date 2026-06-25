import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const servicos = await prisma.servico.findMany({ orderBy: { nome: 'asc' } });
    return res.json(servicos);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const servico = await prisma.servico.findUnique({ where: { id: Number(req.params.id) } });
    if (!servico) return res.status(404).json({ error: 'Serviço não encontrado' });
    return res.json(servico);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar serviço' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao, preco, duracao } = req.body;
    if (!nome || preco === undefined || !duracao) {
      return res.status(400).json({ error: 'Nome, preço e duração são obrigatórios' });
    }
    const servico = await prisma.servico.create({
      data: {
        nome,
        descricao: descricao || null,
        preco: Number(preco),
        duracao: Number(duracao)
      }
    });
    return res.status(201).json(servico);
  } catch {
    return res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao, preco, duracao, ativo } = req.body;
    const servico = await prisma.servico.update({
      where: { id: Number(req.params.id) },
      data: {
        nome,
        descricao: descricao || null,
        preco: preco !== undefined ? Number(preco) : undefined,
        duracao: duracao !== undefined ? Number(duracao) : undefined,
        ativo: ativo !== undefined ? Boolean(ativo) : undefined
      }
    });
    return res.json(servico);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.servico.delete({ where: { id: Number(req.params.id) } });
    return res.json({ message: 'Serviço excluído com sucesso' });
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir serviço' });
  }
});

export default router;
