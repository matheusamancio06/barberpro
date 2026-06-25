import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const produtos = await prisma.produto.findMany({ orderBy: { nome: 'asc' } });
    return res.json(produtos);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const produto = await prisma.produto.findUnique({ where: { id: Number(req.params.id) } });
    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });
    return res.json(produto);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao, preco, estoque, categoria } = req.body;
    if (!nome || preco === undefined) {
      return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
    }
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao || null,
        preco: Number(preco),
        estoque: estoque ? Number(estoque) : 0,
        categoria: categoria || null
      }
    });
    return res.status(201).json(produto);
  } catch {
    return res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, descricao, preco, estoque, categoria, ativo } = req.body;
    const produto = await prisma.produto.update({
      where: { id: Number(req.params.id) },
      data: {
        nome,
        descricao: descricao || null,
        preco: preco !== undefined ? Number(preco) : undefined,
        estoque: estoque !== undefined ? Number(estoque) : undefined,
        categoria: categoria || null,
        ativo: ativo !== undefined ? Boolean(ativo) : undefined
      }
    });
    return res.json(produto);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.produto.delete({ where: { id: Number(req.params.id) } });
    return res.json({ message: 'Produto excluído com sucesso' });
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir produto' });
  }
});

export default router;
