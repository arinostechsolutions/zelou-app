const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Autenticação básica
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('condominium', 'name cnpj');
    
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Autorização por roles (aceita array de roles permitidas)
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Master admin tem acesso a tudo
    if (req.user.isMasterAdmin) {
      return next();
    }

    // Verificar se o role do usuário está na lista de permitidos
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Acesso negado',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Verificar se pode criar usuário com determinado role
const canCreateRole = (targetRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Master admin pode criar qualquer role
    if (req.user.isMasterAdmin) {
      return next();
    }

    const permissions = {
      master: ['master', 'sindico', 'zelador', 'porteiro', 'morador'],
      sindico: ['zelador', 'porteiro', 'morador'],
      zelador: ['porteiro', 'morador'],
      porteiro: [],
      morador: []
    };

    const userPermissions = permissions[req.user.role] || [];

    if (!userPermissions.includes(targetRole)) {
      return res.status(403).json({ 
        message: `Você não tem permissão para criar usuários com o papel "${targetRole}"`,
        yourRole: req.user.role,
        canCreate: userPermissions
      });
    }

    next();
  };
};

// Verificar se usuário pertence ao mesmo condomínio
const sameCondominium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  // Master admin tem acesso a todos os condomínios
  if (req.user.isMasterAdmin) {
    return next();
  }

  const condominiumId = req.params.id || req.params.condominiumId || req.body.condominium;

  if (!condominiumId) {
    return res.status(400).json({ message: 'ID do condomínio não fornecido' });
  }

  if (req.user.condominium._id.toString() !== condominiumId.toString()) {
    return res.status(403).json({ message: 'Acesso negado. Você não pertence a este condomínio' });
  }

  next();
};

// Verificar se é master admin
const isMaster = (req, res, next) => {
  if (!req.user || !req.user.isMasterAdmin) {
    return res.status(403).json({ message: 'Acesso negado. Apenas master admin' });
  }
  next();
};

// Hierarquia de permissões
const ROLE_HIERARCHY = {
  master: 5,
  sindico: 4,
  zelador: 3,
  porteiro: 2,
  morador: 1
};

// Verificar se pode gerenciar outro usuário (baseado em hierarquia)
const canManageUser = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  try {
    const targetUserId = req.params.userId || req.params.id;
    const targetUser = await User.findById(targetUserId).select('-password');

    if (!targetUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Master admin pode gerenciar qualquer um
    if (req.user.isMasterAdmin) {
      req.targetUser = targetUser;
      return next();
    }

    // Verificar se é do mesmo condomínio
    if (req.user.condominium._id.toString() !== targetUser.condominium.toString()) {
      return res.status(403).json({ message: 'Usuário não pertence ao seu condomínio' });
    }

    // Verificar hierarquia
    const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
    const targetLevel = ROLE_HIERARCHY[targetUser.role] || 0;

    if (userLevel <= targetLevel) {
      return res.status(403).json({ 
        message: 'Você não pode gerenciar usuários de nível igual ou superior ao seu',
        yourRole: req.user.role,
        targetRole: targetUser.role
      });
    }

    req.targetUser = targetUser;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao verificar permissões', error: error.message });
  }
};

module.exports = {
  authenticate,
  authorize,
  canCreateRole,
  sameCondominium,
  isMaster,
  canManageUser,
  ROLE_HIERARCHY,
  // Aliases para compatibilidade
  auth: authenticate,
  isMorador: authorize(['morador', 'porteiro', 'zelador', 'sindico']),
  isPorteiro: authorize(['porteiro', 'zelador', 'sindico']),
  isZelador: authorize(['zelador', 'sindico']),
  isSindico: authorize(['sindico'])
};
