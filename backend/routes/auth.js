const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const InviteCode = require('../models/InviteCode');
const { auth } = require('../middleware/auth');
const { generateResetCode, sendPasswordResetEmail } = require('../utils/email');

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
  body('unit.number').trim().notEmpty().withMessage('Número da unidade é obrigatório')
  // Bloco é opcional - alguns condomínios não têm blocos/torres
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
// Envia código de 6 dígitos para o email
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Por segurança, não revelamos se o email existe ou não
      return res.json({ 
        message: 'Se o email existir, você receberá um código de verificação',
        success: true 
      });
    }

    // Gera código de 6 dígitos
    const code = generateResetCode();
    
    // Salva o código e define expiração (15 minutos)
    user.resetPasswordCode = code;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Envia email com o código
    await sendPasswordResetEmail(email, code, user.name.split(' ')[0]);

    res.json({ 
      message: 'Código de verificação enviado para seu email',
      success: true 
    });
  } catch (error) {
    console.error('Erro no forgot-password:', error);
    res.status(500).json({ message: 'Erro ao processar solicitação', error: error.message });
  }
});

// POST /api/auth/verify-reset-code
// Verifica se o código é válido
router.post('/verify-reset-code', [
  body('email').isEmail().withMessage('Email inválido'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Código deve ter 6 dígitos')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code } = req.body;
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    res.json({ 
      message: 'Código verificado com sucesso',
      valid: true 
    });
  } catch (error) {
    console.error('Erro no verify-reset-code:', error);
    res.status(500).json({ message: 'Erro ao verificar código', error: error.message });
  }
});

// POST /api/auth/reset-password
// Redefine a senha com o código verificado
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email inválido'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Código deve ter 6 dígitos'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, code, password } = req.body;
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    // Atualiza a senha (o hash é feito automaticamente no pre-save)
    user.password = password;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ 
      message: 'Senha redefinida com sucesso!',
      success: true 
    });
  } catch (error) {
    console.error('Erro no reset-password:', error);
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

