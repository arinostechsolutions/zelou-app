const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const InviteCode = require('../models/InviteCode');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('cpf').trim().notEmpty().withMessage('CPF é obrigatório'),
  body('phone').trim().notEmpty().withMessage('Telefone é obrigatório'),
  body('inviteCode').trim().notEmpty().withMessage('Código de convite é obrigatório'),
  body('unit.block').trim().notEmpty().withMessage('Bloco é obrigatório'),
  body('unit.number').trim().notEmpty().withMessage('Número da unidade é obrigatório')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, cpf, phone, unit, inviteCode: codeString } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { cpf }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email ou CPF já cadastrado' });
    }

    // Validar código de convite
    const inviteCode = await InviteCode.findOne({ code: codeString.toUpperCase() })
      .populate('condominium');
    
    if (!inviteCode) {
      return res.status(400).json({ message: 'Código de convite inválido' });
    }
    
    if (!inviteCode.isValid()) {
      return res.status(400).json({ message: 'Código de convite expirado ou já utilizado' });
    }
    
    // Verificar se bloco/unidade correspondem ao código (se especificados)
    if (inviteCode.block && inviteCode.block !== unit.block) {
      return res.status(400).json({ message: 'Bloco não corresponde ao código de convite' });
    }
    
    if (inviteCode.unit && inviteCode.unit !== unit.number) {
      return res.status(400).json({ message: 'Unidade não corresponde ao código de convite' });
    }

    const user = new User({
      name,
      email,
      password,
      cpf,
      phone,
      role: inviteCode.role,
      unit,
      condominium: inviteCode.condominium._id,
      inviteCode: codeString.toUpperCase()
    });

    await user.save();
    
    // Incrementar uso do código
    await inviteCode.incrementUse();

    const token = generateToken(user._id);

    // Buscar o usuário com condominium populado
    const populatedUser = await User.findById(user._id).populate('condominium', 'name');

    res.status(201).json({
      token,
      user: {
        id: populatedUser._id,
        name: populatedUser.name,
        email: populatedUser.email,
        role: populatedUser.role,
        unit: populatedUser.unit,
        condominium: populatedUser.condominium,
        isMasterAdmin: populatedUser.isMasterAdmin,
        pushToken: populatedUser.pushToken || null
      }
    });
  } catch (error) {
    console.error('Erro completo ao registrar:', error);
    // Se for erro de validação do MongoDB
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Erro de validação', 
        error: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    // Se for erro de duplicação
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} já está em uso`,
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Erro ao registrar usuário', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').notEmpty().withMessage('Email ou CPF é obrigatório'),
  body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email or CPF and populate condominium
    const user = await User.findOne({
      $or: [{ email }, { cpf: email }]
    }).populate('condominium', 'name');

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        unit: user.unit,
        condominium: user.condominium,
        isMasterAdmin: user.isMasterAdmin,
        pushToken: user.pushToken || null
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
    }

    // TODO: Implement email sending with reset token
    // For now, just return success
    res.json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao processar solicitação', error: error.message });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token é obrigatório'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // TODO: Implement password reset logic with token validation
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao redefinir senha', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('condominium', 'name');
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    unit: user.unit,
    condominium: user.condominium,
    isMasterAdmin: user.isMasterAdmin,
    pushToken: user.pushToken || null
  });
});

module.exports = router;

