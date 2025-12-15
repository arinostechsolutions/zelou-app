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
const { authenticate, isMaster } = require('../middleware/auth');

// GET /api/statistics
router.get('/', authenticate, isMaster, async (req, res) => {
  try {
    const { condominiumId } = req.query;
    
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

    res.json({
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
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas', error: error.message });
  }
});

module.exports = router;

