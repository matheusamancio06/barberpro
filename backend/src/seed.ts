import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // Admin user
  const adminHash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@barbearia.com' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@barbearia.com', senha: adminHash, role: 'admin' }
  });
  console.log('Usuario admin criado');

  // Barbeiros com contas
  const barbeiroHash = await bcrypt.hash('barbeiro123', 10);

  const b1 = await prisma.barbeiro.create({
    data: { nome: 'João Silva', telefone: '(11) 99999-1111', email: 'joao@barbeiro.com', especialidade: 'Corte Clássico', comissao: 50 }
  });
  await prisma.usuario.upsert({
    where: { email: 'joao@barbeiro.com' },
    update: {},
    create: { nome: 'João Silva', email: 'joao@barbeiro.com', senha: barbeiroHash, role: 'barbeiro', barbeiroId: b1.id }
  });

  const b2 = await prisma.barbeiro.create({
    data: { nome: 'Pedro Souza', telefone: '(11) 99999-2222', email: 'pedro@barbeiro.com', especialidade: 'Barba e Bigode', comissao: 55 }
  });
  await prisma.usuario.upsert({
    where: { email: 'pedro@barbeiro.com' },
    update: {},
    create: { nome: 'Pedro Souza', email: 'pedro@barbeiro.com', senha: barbeiroHash, role: 'barbeiro', barbeiroId: b2.id }
  });

  const b3 = await prisma.barbeiro.create({
    data: { nome: 'Lucas Mendes', telefone: '(11) 99999-3333', email: 'lucas@barbeiro.com', especialidade: 'Degradê e Navalhado', comissao: 50 }
  });
  await prisma.usuario.upsert({
    where: { email: 'lucas@barbeiro.com' },
    update: {},
    create: { nome: 'Lucas Mendes', email: 'lucas@barbeiro.com', senha: barbeiroHash, role: 'barbeiro', barbeiroId: b3.id }
  });

  console.log('Barbeiros e usuários criados');

  // Serviços
  const s1 = await prisma.servico.create({ data: { nome: 'Corte Masculino', descricao: 'Corte completo masculino', preco: 35, duracao: 30 } });
  const s2 = await prisma.servico.create({ data: { nome: 'Barba', descricao: 'Aparar e modelar barba', preco: 25, duracao: 20 } });
  const s3 = await prisma.servico.create({ data: { nome: 'Corte + Barba', descricao: 'Corte completo mais barba', preco: 55, duracao: 50 } });
  const s4 = await prisma.servico.create({ data: { nome: 'Degradê', descricao: 'Corte degradê moderno', preco: 40, duracao: 35 } });
  const s5 = await prisma.servico.create({ data: { nome: 'Navalhado', descricao: 'Corte navalhado', preco: 45, duracao: 40 } });
  const s6 = await prisma.servico.create({ data: { nome: 'Pigmentação', descricao: 'Pigmentação capilar', preco: 60, duracao: 60 } });
  console.log('Serviços criados');

  // Produtos
  await prisma.produto.createMany({
    data: [
      { nome: 'Pomada Modeladora', descricao: 'Pomada para cabelo forte fixação', preco: 35, estoque: 20, categoria: 'Cabelo' },
      { nome: 'Óleo para Barba', descricao: 'Óleo hidratante para barba', preco: 45, estoque: 15, categoria: 'Barba' },
      { nome: 'Shampoo Anticaspa', descricao: 'Shampoo tratamento anticaspa', preco: 28, estoque: 10, categoria: 'Cabelo' },
      { nome: 'Balm para Barba', descricao: 'Balm hidratante e condicionador', preco: 38, estoque: 12, categoria: 'Barba' },
      { nome: 'Pente de Madeira', descricao: 'Pente artesanal de madeira', preco: 22, estoque: 8, categoria: 'Acessórios' },
      { nome: 'Navalha Descartável', descricao: 'Pack com 10 navalhas', preco: 15, estoque: 30, categoria: 'Ferramentas' }
    ]
  });
  console.log('Produtos criados');

  // Planos
  await prisma.plano.createMany({
    data: [
      { nome: 'Plano Básico', descricao: 'Corte mensal + 1 barba', preco: 89, duracao: 30, servicos: JSON.stringify([s1.id, s2.id]) },
      { nome: 'Plano Premium', descricao: '2 cortes + 2 barbas por mês', preco: 149, duracao: 30, servicos: JSON.stringify([s1.id, s2.id, s3.id]) },
      { nome: 'Plano VIP', descricao: 'Cortes e barbas ilimitados', preco: 249, duracao: 30, servicos: JSON.stringify([s1.id, s2.id, s3.id, s4.id, s5.id]) }
    ]
  });
  console.log('Planos criados');

  // Clientes com contas
  const clienteHash = await bcrypt.hash('cliente123', 10);

  const c1 = await prisma.cliente.create({ data: { nome: 'Ana Silva', telefone: '(11) 98888-1001', email: 'ana.silva@email.com' } });
  await prisma.usuario.upsert({
    where: { email: 'ana.silva@email.com' },
    update: {},
    create: { nome: 'Ana Silva', email: 'ana.silva@email.com', senha: clienteHash, role: 'cliente', clienteId: c1.id }
  });

  const c2 = await prisma.cliente.create({ data: { nome: 'Carlos Santos', telefone: '(11) 98888-1002', email: 'carlos.santos@email.com' } });
  await prisma.usuario.upsert({
    where: { email: 'carlos.santos@email.com' },
    update: {},
    create: { nome: 'Carlos Santos', email: 'carlos.santos@email.com', senha: clienteHash, role: 'cliente', clienteId: c2.id }
  });

  const c3 = await prisma.cliente.create({ data: { nome: 'Mariana Costa', telefone: '(11) 98888-1003', email: 'mariana.costa@email.com' } });
  await prisma.usuario.upsert({
    where: { email: 'mariana.costa@email.com' },
    update: {},
    create: { nome: 'Mariana Costa', email: 'mariana.costa@email.com', senha: clienteHash, role: 'cliente', clienteId: c3.id }
  });

  const c4 = await prisma.cliente.create({ data: { nome: 'Roberto Lima', telefone: '(11) 98888-1004', email: 'roberto.lima@email.com' } });
  await prisma.usuario.upsert({
    where: { email: 'roberto.lima@email.com' },
    update: {},
    create: { nome: 'Roberto Lima', email: 'roberto.lima@email.com', senha: clienteHash, role: 'cliente', clienteId: c4.id }
  });

  const c5 = await prisma.cliente.create({ data: { nome: 'Julia Ferreira', telefone: '(11) 98888-1005', email: 'julia.ferreira@email.com' } });
  await prisma.usuario.upsert({
    where: { email: 'julia.ferreira@email.com' },
    update: {},
    create: { nome: 'Julia Ferreira', email: 'julia.ferreira@email.com', senha: clienteHash, role: 'cliente', clienteId: c5.id }
  });

  console.log('Clientes e usuários criados');

  // Agendamentos de hoje
  const hoje = new Date();

  await prisma.agendamento.create({
    data: {
      clienteId: c1.id, barbeiroId: b1.id,
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 9, 0),
      status: 'concluido', total: s1.preco + s2.preco,
      servicos: { create: [{ servicoId: s1.id, preco: s1.preco }, { servicoId: s2.id, preco: s2.preco }] }
    }
  });

  await prisma.agendamento.create({
    data: {
      clienteId: c2.id, barbeiroId: b2.id,
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 10, 30),
      status: 'concluido', total: s3.preco,
      servicos: { create: [{ servicoId: s3.id, preco: s3.preco }] }
    }
  });

  await prisma.agendamento.create({
    data: {
      clienteId: c3.id, barbeiroId: b1.id,
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 14, 0),
      status: 'agendado', total: s4.preco,
      servicos: { create: [{ servicoId: s4.id, preco: s4.preco }] }
    }
  });

  await prisma.agendamento.create({
    data: {
      clienteId: c4.id, barbeiroId: b3.id,
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 15, 30),
      status: 'agendado', total: s5.preco,
      servicos: { create: [{ servicoId: s5.id, preco: s5.preco }] }
    }
  });

  await prisma.agendamento.create({
    data: {
      clienteId: c5.id, barbeiroId: b2.id,
      data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 17, 0),
      status: 'agendado', total: s2.preco,
      servicos: { create: [{ servicoId: s2.id, preco: s2.preco }] }
    }
  });

  console.log('Agendamentos criados');
  console.log('\nSeed concluído com sucesso!');
  console.log('--- Credenciais ---');
  console.log('Admin: admin@barbearia.com / admin123');
  console.log('Barbeiro: joao@barbeiro.com / barbeiro123');
  console.log('Barbeiro: pedro@barbeiro.com / barbeiro123');
  console.log('Barbeiro: lucas@barbeiro.com / barbeiro123');
  console.log('Cliente: ana.silva@email.com / cliente123');
  console.log('Cliente: carlos.santos@email.com / cliente123');
  console.log('Cliente: mariana.costa@email.com / cliente123');
  console.log('Cliente: roberto.lima@email.com / cliente123');
  console.log('Cliente: julia.ferreira@email.com / cliente123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
