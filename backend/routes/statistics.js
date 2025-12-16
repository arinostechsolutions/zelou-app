const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Condominium = require('../models/Condominium');
const Delivery = require('../models/Delivery');
const Report = require('../models/Report');
const Reservation = require('../models/Reservation');
const Announcement = require('../models/Announcement');
const Visitor = require('../models/Visitor');
const Maintenance = require('../models/Maintenance');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/statistics - Permitir master admin e síndicos
router.get('/', authenticate, authorize(['sindico', 'master']), async (req, res) => {
  try {
    const { condominiumId } = req.query;
    const isMasterAdmin = req.user.isMasterAdmin;
    
    // Query base - se condominiumId for fornecido, filtra por ele
    const condominiumFilter = condominiumId ? { condominium: condominiumId } : {};
    
    // Estatísticas gerais
    const totalUsers = await User.countDocuments(condominiumFilter);
    const totalCondominiums = await Condominium.countDocuments();
    
    // Para deliveries, reports e reservations, precisamos fazer lookup para filtrar por condomínio
    let totalDeliveries = 0;
    let totalReports = 0;
    let totalReservations = 0;
    
    if (condominiumId) {
      // Entregas: buscar usuários do condomínio primeiro
      const usersInCondominium = await User.find({ condominium: condominiumId }).select('_id');
      const userIds = usersInCondominium.map(u => u._id);
      totalDeliveries = await Delivery.countDocuments({ residentId: { $in: userIds } });
      
      // Reports: buscar usuários do condomínio
      totalReports = await Report.countDocuments({ createdBy: { $in: userIds } });
      
      // Reservations: buscar áreas do condomínio primeiro
      const Area = require('../models/Area');
      const areasInCondominium = await Area.find({ condominium: condominiumId }).select('_id');
      const areaIds = areasInCondominium.map(a => a._id);
      totalReservations = await Reservation.countDocuments({ areaId: { $in: areaIds } });
    } else {
      totalDeliveries = await Delivery.countDocuments();
      totalReports = await Report.countDocuments();
      totalReservations = await Reservation.countDocuments();
    }
    
    const totalAnnouncements = condominiumId
      ? await Announcement.countDocuments({ condominium: condominiumId })
      : await Announcement.countDocuments();
    const totalVisitors = condominiumId
      ? await Visitor.countDocuments({ condominium: condominiumId })
      : await Visitor.countDocuments();
    const totalMaintenances = condominiumId
      ? await Maintenance.countDocuments({ condominium: condominiumId })
      : await Maintenance.countDocuments();

    // Usuários por condomínio
    const usersByCondominiumPipeline = [
      ...(condominiumId ? [{ $match: { condominium: condominiumId } }] : []),
      {
        $group: {
          _id: '$condominium',
          count: { $sum: 1 },
          roles: {
            $push: '$role'
          }
        }
      },
      {
        $lookup: {
          from: 'condominiums',
          localField: '_id',
          foreignField: '_id',
          as: 'condominium'
        }
      },
      {
        $unwind: {
          path: '$condominium',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          condominiumName: '$condominium.name',
          count: 1,
          roles: 1,
          _id: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    const usersByCondominium = await User.aggregate(usersByCondominiumPipeline);

    // Contar roles por condomínio
    const usersByCondominiumWithRoles = usersByCondominium.map(item => {
      const rolesCount = {
        morador: 0,
        porteiro: 0,
        zelador: 0,
        sindico: 0,
        master: 0
      };
      
      item.roles.forEach(role => {
        if (rolesCount[role] !== undefined) {
          rolesCount[role]++;
        }
      });

      return {
        condominiumId: item._id,
        condominiumName: item.condominiumName || 'Não informado',
        totalUsers: item.count,
        roles: rolesCount
      };
    });

    // Estatísticas de entregas
    let deliveriesByStatus = [];
    if (condominiumId) {
      const usersInCondominium = await User.find({ condominium: condominiumId }).select('_id');
      const userIds = usersInCondominium.map(u => u._id);
      deliveriesByStatus = await Delivery.aggregate([
        { $match: { residentId: { $in: userIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    } else {
      deliveriesByStatus = await Delivery.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    }

    // Estatísticas de reservas
    let reservationsByStatus = [];
    if (condominiumId) {
      const Area = require('../models/Area');
      const areasInCondominium = await Area.find({ condominium: condominiumId }).select('_id');
      const areaIds = areasInCondominium.map(a => a._id);
      reservationsByStatus = await Reservation.aggregate([
        { $match: { areaId: { $in: areaIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    } else {
      reservationsByStatus = await Reservation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    }

    // Estatísticas de irregularidades
    let reportsByStatus = [];
    if (condominiumId) {
      const usersInCondominium = await User.find({ condominium: condominiumId }).select('_id');
      const userIds = usersInCondominium.map(u => u._id);
      reportsByStatus = await Report.aggregate([
        { $match: { createdBy: { $in: userIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    } else {
      reportsByStatus = await Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
    }

    // Estatísticas de manutenções
    const maintenancesByStatusPipeline = condominiumId
      ? [
          { $match: { condominium: condominiumId } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]
      : [{ $group: { _id: '$status', count: { $sum: 1 } } }];
    
    const maintenancesByStatus = await Maintenance.aggregate(maintenancesByStatusPipeline);

    // Usuários por role (global ou filtrado)
    const usersByRolePipeline = [
      ...(condominiumId ? [{ $match: { condominium: condominiumId } }] : []),
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ];
    
    const usersByRole = await User.aggregate(usersByRolePipeline);

    // Atividade recente (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let recentDeliveries = 0;
    let recentReports = 0;
    let recentReservations = 0;
    
    if (condominiumId) {
      const usersInCondominium = await User.find({ condominium: condominiumId }).select('_id');
      const userIds = usersInCondominium.map(u => u._id);
      
      recentDeliveries = await Delivery.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        residentId: { $in: userIds }
      });

      recentReports = await Report.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        createdBy: { $in: userIds }
      });

      const Area = require('../models/Area');
      const areasInCondominium = await Area.find({ condominium: condominiumId }).select('_id');
      const areaIds = areasInCondominium.map(a => a._id);
      
      recentReservations = await Reservation.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        areaId: { $in: areaIds }
      });
    } else {
      recentDeliveries = await Delivery.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      recentReports = await Report.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      recentReservations = await Reservation.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });
    }

    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
      ...condominiumFilter
    });

    // Base response
    const response = {
      overview: {
        totalUsers,
        totalCondominiums,
        totalDeliveries,
        totalReports,
        totalReservations,
        totalAnnouncements,
        totalVisitors,
        totalMaintenances,
      },
      usersByCondominium: usersByCondominiumWithRoles,
      usersByRole: usersByRole.map(item => ({
        role: item._id,
        count: item.count
      })),
      deliveriesByStatus: deliveriesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      reservationsByStatus: reservationsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      reportsByStatus: reportsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      maintenancesByStatus: maintenancesByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity: {
        deliveries: recentDeliveries,
        reports: recentReports,
        reservations: recentReservations,
        users: recentUsers,
      }
    };

    // Métricas adicionais apenas para Master Admin
    if (isMasterAdmin && !condominiumId) {
      // Crescimento mensal (últimos 6 meses)
      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const monthUsers = await User.countDocuments({
          createdAt: { $gte: monthStart, $lt: monthEnd }
        });
        
        const monthCondominiums = await Condominium.countDocuments({
          createdAt: { $gte: monthStart, $lt: monthEnd }
        });
        
        const monthDeliveries = await Delivery.countDocuments({
          createdAt: { $gte: monthStart, $lt: monthEnd }
        });
        
        const monthReports = await Report.countDocuments({
          createdAt: { $gte: monthStart, $lt: monthEnd }
        });
        
        monthlyGrowth.push({
          month: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          users: monthUsers,
          condominiums: monthCondominiums,
          deliveries: monthDeliveries,
          reports: monthReports,
        });
      }

      // Top 10 condomínios por número de usuários
      const topCondominiums = await User.aggregate([
        {
          $group: {
            _id: '$condominium',
            userCount: { $sum: 1 },
            deliveries: { $sum: 1 }, // Placeholder, será calculado separadamente
          }
        },
        {
          $lookup: {
            from: 'condominiums',
            localField: '_id',
            foreignField: '_id',
            as: 'condominium'
          }
        },
        {
          $unwind: {
            path: '$condominium',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            condominiumId: '$_id',
            condominiumName: '$condominium.name',
            userCount: 1,
            _id: 0
          }
        },
        {
          $sort: { userCount: -1 }
        },
        {
          $limit: 10
        }
      ]);

      // Adicionar contagem de entregas e relatórios para cada condomínio
      for (const condo of topCondominiums) {
        const usersInCondo = await User.find({ condominium: condo.condominiumId }).select('_id');
        const userIds = usersInCondo.map(u => u._id);
        
        condo.deliveries = await Delivery.countDocuments({ residentId: { $in: userIds } });
        condo.reports = await Report.countDocuments({ createdBy: { $in: userIds } });
        
        const Area = require('../models/Area');
        const areasInCondo = await Area.find({ condominium: condo.condominiumId }).select('_id');
        const areaIds = areasInCondo.map(a => a._id);
        condo.reservations = await Reservation.countDocuments({ areaId: { $in: areaIds } });
      }

      // Taxa de crescimento (comparar últimos 30 dias com 30 dias anteriores)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const recent30DaysUsers = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      const previous30DaysUsers = await User.countDocuments({
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      });
      
      const recent30DaysCondominiums = await Condominium.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      const previous30DaysCondominiums = await Condominium.countDocuments({
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      });
      
      const userGrowthRate = previous30DaysUsers > 0 
        ? ((recent30DaysUsers - previous30DaysUsers) / previous30DaysUsers * 100).toFixed(1)
        : recent30DaysUsers > 0 ? '100.0' : '0.0';
      
      const condoGrowthRate = previous30DaysCondominiums > 0
        ? ((recent30DaysCondominiums - previous30DaysCondominiums) / previous30DaysCondominiums * 100).toFixed(1)
        : recent30DaysCondominiums > 0 ? '100.0' : '0.0';

      // Distribuição de usuários por estado (se houver dados de endereço)
      const usersByState = await User.aggregate([
        {
          $lookup: {
            from: 'condominiums',
            localField: 'condominium',
            foreignField: '_id',
            as: 'condominium'
          }
        },
        {
          $unwind: {
            path: '$condominium',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: '$condominium.address.state',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $project: {
            state: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);

      // Estatísticas de uso de APIs (aproximação baseada em ações)
      const apiUsage = {
        deliveries: {
          total: totalDeliveries,
          percentage: totalUsers > 0 ? ((totalDeliveries / totalUsers) * 100).toFixed(1) : '0.0'
        },
        reports: {
          total: totalReports,
          percentage: totalUsers > 0 ? ((totalReports / totalUsers) * 100).toFixed(1) : '0.0'
        },
        reservations: {
          total: totalReservations,
          percentage: totalUsers > 0 ? ((totalReservations / totalUsers) * 100).toFixed(1) : '0.0'
        },
        visitors: {
          total: totalVisitors,
          percentage: totalUsers > 0 ? ((totalVisitors / totalUsers) * 100).toFixed(1) : '0.0'
        },
        announcements: {
          total: totalAnnouncements,
          percentage: totalCondominiums > 0 ? ((totalAnnouncements / totalCondominiums) * 100).toFixed(1) : '0.0'
        },
        maintenances: {
          total: totalMaintenances,
          percentage: totalCondominiums > 0 ? ((totalMaintenances / totalCondominiums) * 100).toFixed(1) : '0.0'
        }
      };

      // Adicionar métricas de master admin ao response
      response.masterAdminMetrics = {
        monthlyGrowth,
        topCondominiums,
        growthRates: {
          users: {
            current: recent30DaysUsers,
            previous: previous30DaysUsers,
            rate: userGrowthRate,
            trend: parseFloat(userGrowthRate) >= 0 ? 'up' : 'down'
          },
          condominiums: {
            current: recent30DaysCondominiums,
            previous: previous30DaysCondominiums,
            rate: condoGrowthRate,
            trend: parseFloat(condoGrowthRate) >= 0 ? 'up' : 'down'
          }
        },
        usersByState,
        apiUsage
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
});

module.exports = router;

