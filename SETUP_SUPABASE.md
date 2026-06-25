# Como Configurar o Supabase (Banco de Dados)

## Passo 1 — Criar o projeto no Supabase

1. Acesse https://supabase.com e faça login (pode usar conta Google)
2. Clique em **"New project"**
3. Escolha um nome (ex: `barberpro`)
4. Crie uma senha forte para o banco (guarde ela!)
5. Escolha a região **South America (São Paulo)** para menor latência
6. Clique em **"Create new project"** e aguarde ~1 minuto

## Passo 2 — Pegar as credenciais

1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem no canto inferior esquerdo)
2. Clique em **"Database"**
3. Role até a seção **"Connection string"**
4. Selecione a aba **"URI"**
5. Mude o modo para **"Transaction"** e copie a URL → esta é a `DATABASE_URL`
6. Mude o modo para **"Session"** e copie a URL → esta é a `DIRECT_URL`
7. Substitua `[YOUR-PASSWORD]` pela senha criada no Passo 1

## Passo 3 — Preencher o .env do backend

Abra o arquivo `backend/.env` e cole as URLs:

```
DATABASE_URL="postgresql://postgres.XXXXXXXXXXX:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.XXXXXXXXXXX:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="barbearia_secret_change_in_production"
PORT=3001
```

## Passo 4 — Criar as tabelas e dados iniciais

Abra o terminal na pasta `backend` e rode:

```bash
npx prisma db push
npx ts-node src/seed.ts
```

O primeiro comando cria todas as tabelas no Supabase.
O segundo popula o banco com dados de teste.

## Passo 5 — Testar localmente

Dê duplo clique no `iniciar.bat` e acesse http://localhost:5173

---

## Credenciais de Teste

| Conta | E-mail | Senha |
|-------|--------|-------|
| Admin | admin@barbearia.com | admin123 |
| Barbeiro | joao@barbeiro.com | barbeiro123 |
| Barbeiro | pedro@barbeiro.com | barbeiro123 |
| Barbeiro | lucas@barbeiro.com | barbeiro123 |
| Cliente | ana.silva@email.com | cliente123 |
| Cliente | carlos.santos@email.com | cliente123 |
| Cliente | mariana.costa@email.com | cliente123 |
| Cliente | roberto.lima@email.com | cliente123 |
| Cliente | julia.ferreira@email.com | cliente123 |
