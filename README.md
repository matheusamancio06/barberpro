# BarberPro - Sistema de Gerenciamento de Barbearia

## Setup Supabase
1. Crie um projeto em supabase.com
2. Vá em Project Settings > Database > Connection string
3. Copie a "Transaction pooler" URI e cole em backend/.env como DATABASE_URL
4. Copie a "Session pooler" URI e cole em backend/.env como DIRECT_URL
5. Execute: cd backend && npx prisma db push && npx ts-node src/seed.ts

## Credenciais de Teste
- Admin: admin@barbearia.com / admin123
- Barbeiro: joao@barbeiro.com / barbeiro123
- Barbeiro: pedro@barbeiro.com / barbeiro123
- Barbeiro: lucas@barbeiro.com / barbeiro123
- Cliente: ana.silva@email.com / cliente123
- Cliente: carlos.santos@email.com / cliente123

## Iniciar Localmente
- Backend: cd backend && npm run dev
- Frontend: cd frontend && npm run dev
