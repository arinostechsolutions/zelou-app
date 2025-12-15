const express = require('express');
const router = express.Router();
const User = require('../models/User');
const InviteCode = require('../models/InviteCode');
const { authenticate, authorize, canCreateRole, canManageUser, isMaster } = require('../middleware/auth');

// Listar usuários do condomínio
router.get('/', authenticate, async (req, res) => {
  try {
    const query = req.user.isMasterAdmin 
      ? {} 
      : { condominium: req.user.condominium._id };

    const users = await User.find(query)
      .select('-password')
      .populate('condominium', 'name')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
});

// Buscar usuário por bloco/unidade (bloco é opcional)
router.get('/lookup', authenticate, authorize(['porteiro', 'zelador', 'sindico', 'master']), async (req, res) => {
  try {
    const { block, number, condominiumId } = req.query;

    if (!number) {
      return res.status(400).json({ message: 'Número da unidade é obrigatório' });
    }

    const query = {
      'unit.number': new RegExp(`^${number}$`, 'i'),
    };

    // Bloco é opcional - só adiciona se foi informado
    if (block) {
      query['unit.block'] = new RegExp(`^${block}$`, 'i');
    }

    if (req.user.isMasterAdmin) {
      if (condominiumId) {
        query.condominium = condominiumId;
      }
    } else {
      query.condominium = req.user.condominium._id;
    }

    const user = await User.findOne(query).select('name email phone unit role condominium');

    if (!user) {
      return res.status(404).json({ message: 'Morador não encontrado para a unidade informada' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar morador', error: error.message });
  }
});

// Listar usuários por condomínio (master admin)
router.get('/condominium/:condominiumId', authenticate, isMaster, async (req, res) => {
  try {
    const users = await User.find({ condominium: req.params.condominiumId })
      .select('-password')
      .populate('condominium', 'name')
      .sort({ role: 1, name: 1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuários', error: error.message });
  }
});

// ============================================
// ROTAS /me/* - DEVEM VIR ANTES DE /:id
// ============================================

// Atualizar dados pessoais do usuário logado
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verificar se email já existe (se estiver mudando)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Este email já está em uso por outro usuário' });
      }
    }

    // Atualizar campos básicos
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;

    // Se quiser mudar a senha, precisa informar a senha atual
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Informe a senha atual para alterar a senha' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }

      user.password = newPassword;
    }

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('condominium', 'name');

    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(400).json({ message: 'Erro ao atualizar perfil', error: error.message });
  }
});

// Atualizar push token do usuário logado
router.put('/me/push-token', authenticate, async (req, res) => {
  try {
    const { pushToken } = req.body;

    // Se pushToken é vazio/null, apenas limpa o token do usuário atual
    if (!pushToken || pushToken === '') {
      req.user.pushToken = null;
      await req.user.save();
      return res.json({ pushToken: null, message: 'Push token removido' });
    }

    // Remove esse token de outros usuários (evita duplicatas)
    await User.updateMany(
      { 
        _id: { $ne: req.user._id }, 
        pushToken: pushToken 
      },
      { $set: { pushToken: null } }
    );

    // Atualiza o token do usuário atual
    req.user.pushToken = pushToken;
    await req.user.save();

    res.json({ pushToken });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar push token', error: error.message });
  }
});

// ============================================
// ROTAS /:id - DEVEM VIR DEPOIS DE /me/*
// ============================================

// Buscar usuário por ID
router.get('/:id', authenticate, canManageUser, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('condominium');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar usuário', error: error.message });
  }
});

// Criar usuário (com código de convite ou direto por admin/síndico/zelador)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, password, cpf, phone, role, unit, inviteCode: codeString } = req.body;

    // Verificar se pode criar esse role
    const permissions = {
      master: ['master', 'sindico', 'zelador', 'porteiro', 'morador'],
      sindico: ['zelador', 'porteiro', 'morador'],
      zelador: ['porteiro', 'morador'],
    };

    const userPermissions = req.user.isMasterAdmin 
      ? permissions.master 
      : (permissions[req.user.role] || []);

    if (!userPermissions.includes(role)) {
      return res.status(403).json({ 
        message: `Você não tem permissão para criar usuários com o papel "${role}"`,
        canCreate: userPermissions
      });
    }

    // Verificar se usuário já existe
    const existingUser = await User.findOne({ $or: [{ email }, { cpf }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email ou CPF já cadastrado' });
    }

    let condominium = req.user.condominium._id;

    // Se for master admin, pode especificar o condomínio
    if (req.user.isMasterAdmin && req.body.condominium) {
      condominium = req.body.condominium;
    }

    // Se tiver código de convite, validar
    if (codeString) {
      const inviteCode = await InviteCode.findOne({ code: codeString.toUpperCase() })
        .populate('condominium');
      
      if (!inviteCode) {
        return res.status(400).json({ message: 'Código de convite inválido. Entre em contato com o síndico ou zelador do seu condomínio.' });
      }
      
      // Verificar se o código está ativo
      if (!inviteCode.isActive) {
        return res.status(400).json({ message: 'Este código de convite está inativo. Entre em contato com o síndico ou zelador do seu condomínio.' });
      }
      
      // Verificar se o código expirou
      if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Este código de convite expirou. Entre em contato com o síndico ou zelador do seu condomínio para obter um novo código.' });
      }
      
      // Verificar se o código atingiu o limite de usos
      if (inviteCode.usedCount >= inviteCode.maxUses) {
        return res.status(400).json({ message: 'O limite de uso deste código de convite foi excedido. Entre em contato com o síndico ou zelador do seu condomínio para obter um novo código.' });
      }

      condominium = inviteCode.condominium._id;
      await inviteCode.incrementUse();
    }

    const user = new User({
      name,
      email,
      password,
      cpf,
      phone,
      role,
      unit,
      condominium,
      inviteCode: codeString?.toUpperCase()
    });

    await user.save();

    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('condominium', 'name');

    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar usuário', error: error.message });
  }
});

// Atualizar usuário
router.put('/:id', authenticate, canManageUser, async (req, res) => {
  try {
    const { name, email, cpf, phone, unit, role } = req.body;
    const user = req.targetUser;

    // Verificar se pode alterar o role
    if (role && role !== user.role) {
      const permissions = {
        master: ['master', 'sindico', 'zelador', 'porteiro', 'morador'],
        sindico: ['zelador', 'porteiro', 'morador'],
        zelador: ['porteiro', 'morador'],
      };

      const userPermissions = req.user.isMasterAdmin 
        ? permissions.master 
        : (permissions[req.user.role] || []);

      if (!userPermissions.includes(role)) {
        return res.status(403).json({ 
          message: `Você não tem permissão para alterar para o papel "${role}"`,
          canCreate: userPermissions
        });
      }
    }

    // Verificar se email já existe (se estiver mudando)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ message: 'Este email já está em uso por outro usuário' });
      }
    }

    // Verificar se CPF já existe (se estiver mudando)
    if (cpf && cpf !== user.cpf) {
      const existingCpf = await User.findOne({ cpf, _id: { $ne: user._id } });
      if (existingCpf) {
        return res.status(400).json({ message: 'Este CPF já está em uso por outro usuário' });
      }
    }

    // Atualizar campos
    if (name) user.name = name;
    if (email) user.email = email;
    if (cpf) user.cpf = cpf;
    if (phone) user.phone = phone;
    if (unit) user.unit = unit;
    if (role) user.role = role;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('condominium', 'name');

    res.json(updatedUser);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(400).json({ message: 'Erro ao atualizar usuário', error: error.message });
  }
});

// Deletar usuário
router.delete('/:id', authenticate, canManageUser, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar usuário', error: error.message });
  }
});

module.exports = router;
