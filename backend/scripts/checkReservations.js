// Script para limpar reservas órfãs
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Area = require('../models/Area');
const Reservation = require('../models/Reservation');

async function cleanOrphanReservations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');

    // Buscar todas as reservas
    const allReservations = await Reservation.find();
    console.log('\n📊 Total de reservas:', allReservations.length);

    // Buscar IDs de usuários existentes
    const existingUsers = await User.find().select('_id');
    const existingUserIds = existingUsers.map(u => u._id.toString());
    console.log('📊 Usuários existentes:', existingUserIds.length);

    // Encontrar reservas cujo userId não existe mais
    const orphanReservations = allReservations.filter(r => {
      if (!r.userId) return true; // userId é null
      return !existingUserIds.includes(r.userId.toString()); // userId não existe
    });

    console.log('\n📊 Reservas órfãs (usuário deletado):', orphanReservations.length);
    
    if (orphanReservations.length > 0) {
      console.log('\nReservas a serem deletadas:');
      orphanReservations.forEach((r, i) => {
        console.log(`  ${i + 1}. ID: ${r._id} - userId: ${r.userId} - date: ${r.date.toLocaleDateString('pt-BR')}`);
      });

      // Deletar reservas órfãs
      const orphanIds = orphanReservations.map(r => r._id);
      const result = await Reservation.deleteMany({ _id: { $in: orphanIds } });
      console.log('\n✅ Reservas órfãs deletadas:', result.deletedCount);
    }

    // Mostrar reservas restantes
    const remaining = await Reservation.find()
      .populate('userId', 'name')
      .populate('areaId', 'name');
    
    console.log('\n📊 Reservas restantes:', remaining.length);
    remaining.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.userId?.name || 'N/A'} - ${r.areaId?.name || 'N/A'} - ${r.date.toLocaleDateString('pt-BR')} - ${r.status}`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

cleanOrphanReservations();

