import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'barbearia_secret_2024';

function makeToken(user: { id: number; email: string; role: string; clienteId?: number | null; barbeiroId?: number | null }) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, clienteId: user.clienteId ?? undefined, barbeiroId: user.barbeiroId ?? undefined },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Login (all roles)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.ativo) return res.status(401).json({ error: 'Credenciais inválidas' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = makeToken(usuario);
    return res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role, clienteId: usuario.clienteId, barbeiroId: usuario.barbeiroId }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Public client registration
router.post('/registrar-cliente', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    if (!nome || !email || !senha || !telefone) {
      return res.status(400).json({ error: 'Nome, email, senha e telefone são obrigatórios' });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.create({
        data: { nome, email, telefone }
      });
      const usuario = await tx.usuario.create({
        data: { nome, email, senha: senhaHash, role: 'cliente', clienteId: cliente.id }
      });
      return { cliente, usuario };
    });

    const token = makeToken(result.usuario);
    return res.status(201).json({
      token,
      usuario: { id: result.usuario.id, nome: result.usuario.nome, email: result.usuario.email, role: result.usuario.role, clienteId: result.usuario.clienteId }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Admin creates any account (admin/barbeiro/cliente)
router.post('/criar-conta', authMiddleware, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { nome, email, senha, role, telefone, barbeiroId, clienteId } = req.body;
    if (!nome || !email || !senha || !role) {
      return res.status(400).json({ error: 'Nome, email, senha e role são obrigatórios' });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const senhaHash = await bcrypt.hash(senha, 10);

    let finalClienteId = clienteId ? Number(clienteId) : undefined;
    let finalBarbeiroId = barbeiroId ? Number(barbeiroId) : undefined;

    if (role === 'cliente' && !finalClienteId && telefone) {
      const cliente = await prisma.cliente.create({ data: { nome, email, telefone } });
      finalClienteId = cliente.id;
    }

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, role, clienteId: finalClienteId, barbeiroId: finalBarbeiroId }
    });

    return res.status(201).json({
      id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role,
      clienteId: usuario.clienteId, barbeiroId: usuario.barbeiroId, ativo: usuario.ativo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Google OAuth — called after Supabase redirects back to the frontend
router.post('/oauth', async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: 'Token obrigatório' });

    // Verify token with Supabase and get user info
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !user || !user.email) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    const email = user.email;
    const nome = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || email;

    // Find or create our Usuario record
    let usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      // First Google login — create Cliente + Usuario records
      const result = await prisma.$transaction(async (tx) => {
        const cliente = await tx.cliente.create({
          data: { nome, email, telefone: '' }
        });
        const novoUsuario = await tx.usuario.create({
          data: { nome, email, senha: '', role: 'cliente', clienteId: cliente.id }
        });
        return novoUsuario;
      });
      usuario = result;
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Conta desativada. Entre em contato com o administrador.' });
    }

    const token = makeToken(usuario);
    return res.json({
      token,
      usuario: {
        id: usuario.id, nome: usuario.nome, email: usuario.email,
        role: usuario.role, clienteId: usuario.clienteId, barbeiroId: usuario.barbeiroId
      }
    });
  } catch (err) {
    console.error('OAuth error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
