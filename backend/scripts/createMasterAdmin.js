const mongoose = require('mongoose');
const User = require('../models/User');
const Condominium = require('../models/Condominium');
require('dotenv').config();

async function createMasterAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zelou');
    console.log('Conectado ao MongoDB');

    // Criar condomínio padrão para o master admin
    let masterCondo = await Condominium.findOne({ name: 'Administração Master' });
    
    if (!masterCondo) {
      masterCondo = new Condominium({
        name: 'Administração Master',
        cnpj: '00000000000000',
        address: {
          street: 'N/A',
          number: 'N/A',
          neighborhood: 'N/A',
          city: 'N/A',
          state: 'N/A',
          zipCode: '00000000'
        },
        blocks: ['Admin']
      });
      await masterCondo.save();
      console.log('Condomínio master criado');
    }

    // Verificar se já existe master admin
    const existingMaster = await User.findOne({ isMasterAdmin: true });
    if (existingMaster) {
      console.log('Master admin já existe:', existingMaster.email);
      process.exit(0);
    }

    // Criar master admin
    const masterAdmin = new User({
      name: 'Master Admin',
      email: 'consultoria.afonsocruz@gmail.com',
      password: '231120Ml#', // ALTERE ISSO!
      cpf: '05892572773',
      phone: '22992645933',
      role: 'master',
      unit: {
        block: 'Admin',
        number: '000'
      },
      condominium: masterCondo._id,
      isMasterAdmin: true
    });

    await masterAdmin.save();
    console.log('Master admin criado com sucesso!');
    console.log('Email:', masterAdmin.email);
    console.log('Senha: master123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');

    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar master admin:', error);
    process.exit(1);
  }
}

createMasterAdmin();


