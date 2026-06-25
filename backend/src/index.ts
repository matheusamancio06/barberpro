import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth';
import clientesRoutes from './routes/clientes';
import barbeirosRoutes from './routes/barbeiros';
import servicosRoutes from './routes/servicos';
import produtosRoutes from './routes/produtos';
import planosRoutes from './routes/planos';
import agendamentosRoutes from './routes/agendamentos';
import dashboardRoutes from './routes/dashboard';
import usuariosRoutes from './routes/usuarios';
import reservasRoutes from './routes/reservas';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin === 'http://localhost:5173' || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/barbeiros', barbeirosRoutes);
app.use('/api/servicos', servicosRoutes);
app.use('/api/produtos', produtosRoutes);
app.use('/api/planos', planosRoutes);
app.use('/api/agendamentos', agendamentosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/reservas', reservasRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
export default app;
