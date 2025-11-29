const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zelou';
mongoose.connect(mongoUri)
.then(() => console.log('MongoDB conectado'))
.catch(err => console.error('Erro ao conectar MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/condominiums', require('./routes/condominiums'));
app.use('/api/users', require('./routes/users'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/areas', require('./routes/areas'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/maintenances', require('./routes/maintenances'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API funcionando' });
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escuta em todas as interfaces de rede

app.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`Acesse de outros dispositivos usando: http://192.168.1.64:${PORT}`);
});


