const express = require('express');
const router = express.Router();
const Condominium = require('../models/Condominium');
const InviteCode = require('../models/InviteCode');
const { authenticate, authorize } = require('../middleware/auth');

// Listar condomínios (apenas master admin)
router.get('/', authenticate, authorize(['master']), async (req, res) => {
  try {
    const condominiums = await Condominium.find().sort({ createdAt: -1 });
    res.json(condominiums);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar condomínios', error: error.message });
  }
});

// Buscar condomínio por ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const condominium = await Condominium.findById(req.params.id);
    if (!condominium) {
      return res.status(404).json({ message: 'Condomínio não encontrado' });
    }
    
    // Verificar se usuário tem acesso
    if (!req.user.isMasterAdmin && req.user.condominium.toString() !== condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    res.json(condominium);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar condomínio', error: error.message });
  }
});

// Criar condomínio (apenas master admin)
router.post('/', authenticate, authorize(['master']), async (req, res) => {
  try {
    const condominium = new Condominium(req.body);
    await condominium.save();
    res.status(201).json(condominium);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao criar condomínio', error: error.message });
  }
});

// Atualizar condomínio
router.put('/:id', authenticate, authorize(['master', 'sindico']), async (req, res) => {
  try {
    const condominium = await Condominium.findById(req.params.id);
    if (!condominium) {
      return res.status(404).json({ message: 'Condomínio não encontrado' });
    }
    
    // Verificar se usuário tem acesso
    if (!req.user.isMasterAdmin && req.user.condominium.toString() !== condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    Object.assign(condominium, req.body);
    await condominium.save();
    res.json(condominium);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar condomínio', error: error.message });
  }
});

// Gerar código de convite
router.post('/:id/invite-codes', authenticate, authorize(['master', 'sindico', 'zelador']), async (req, res) => {
  try {
    const condominium = await Condominium.findById(req.params.id);
    if (!condominium) {
      return res.status(404).json({ message: 'Condomínio não encontrado' });
    }
    
    // Verificar se usuário tem acesso
    if (!req.user.isMasterAdmin && req.user.condominium.toString() !== condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const { role, block, unit, maxUses, expiresAt } = req.body;
    
    // Gerar código único
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = InviteCode.generateCode();
      const existing = await InviteCode.findOne({ code });
      if (!existing) isUnique = true;
    }
    
    const inviteCode = new InviteCode({
      code,
      condominium: condominium._id,
      role,
      block,
      unit,
      maxUses: maxUses || 1,
      expiresAt: expiresAt || undefined,
      createdBy: req.user._id
    });
    
    await inviteCode.save();
    await inviteCode.populate('condominium', 'name');
    
    res.status(201).json(inviteCode);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao gerar código de convite', error: error.message });
  }
});

// Listar códigos de convite do condomínio
router.get('/:id/invite-codes', authenticate, authorize(['master', 'sindico', 'zelador']), async (req, res) => {
  try {
    const condominium = await Condominium.findById(req.params.id);
    if (!condominium) {
      return res.status(404).json({ message: 'Condomínio não encontrado' });
    }
    
    // Verificar se usuário tem acesso
    if (!req.user.isMasterAdmin && req.user.condominium.toString() !== condominium._id.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    const inviteCodes = await InviteCode.find({ condominium: condominium._id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(inviteCodes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar códigos de convite', error: error.message });
  }
});

// Desativar código de convite
router.delete('/:condoId/invite-codes/:codeId', authenticate, authorize(['master', 'sindico', 'zelador']), async (req, res) => {
  try {
    const inviteCode = await InviteCode.findById(req.params.codeId);
    if (!inviteCode) {
      return res.status(404).json({ message: 'Código não encontrado' });
    }
    
    // Verificar se usuário tem acesso
    if (!req.user.isMasterAdmin && req.user.condominium.toString() !== inviteCode.condominium.toString()) {
      return res.status(403).json({ message: 'Acesso negado' });
    }
    
    inviteCode.isActive = false;
    await inviteCode.save();
    
    res.json({ message: 'Código desativado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao desativar código', error: error.message });
  }
});

module.exports = router;


