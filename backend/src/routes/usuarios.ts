import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, nome: true, email: true, role: true, ativo: true, clienteId: true, barbeiroId: true, createdAt: true }
    });
    return res.json(usuarios);
  } catch {
    return res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, email, senha, role, ativo, clienteId, barbeiroId } = req.body;
    const data: Record<string, unknown> = {};
    if (nome) data.nome = nome;
    if (email) data.email = email;
    if (senha) data.senha = await bcrypt.hash(senha, 10);
    if (role) data.role = role;
    if (ativo !== undefined) data.ativo = ativo;
    if (clienteId !== undefined) data.clienteId = clienteId ? Number(clienteId) : null;
    if (barbeiroId !== undefined) data.barbeiroId = barbeiroId ? Number(barbeiroId) : null;

    const usuario = await prisma.usuario.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, nome: true, email: true, role: true, ativo: true, clienteId: true, barbeiroId: true }
    });
    return res.json(usuario);
  } catch {
    return res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.id === Number(req.params.id)) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
    }
    await prisma.usuario.delete({ where: { id: Number(req.params.id) } });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
});

export default router;
