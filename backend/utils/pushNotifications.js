const { Expo } = require('expo-server-sdk');
const Notification = require('../models/Notification');

const expo = new Expo();

/**
 * Envia push notification e salva no banco de dados
 * @param {Object} options
 * @param {string} options.to - Push token do destinatário
 * @param {string} options.title - Título da notificação
 * @param {string} options.body - Corpo da notificação
 * @param {Object} options.data - Dados extras (type, id, etc)
 * @param {string} options.userId - ID do usuário (para salvar no banco)
 */
const sendPushNotification = async ({ to, title, body, data = {}, userId }) => {
  try {
    // Salvar notificação no banco se tiver userId
    if (userId) {
      await Notification.create({
        userId,
        title,
        body,
        type: data.type || 'general',
        data
      });
    }

    // Enviar push notification se tiver token válido
    if (to && Expo.isExpoPushToken(to)) {
      const messages = [
        {
          to,
          sound: 'default',
          title,
          body,
          data,
        },
      ];

      await expo.sendPushNotificationsAsync(messages);
    }
  } catch (error) {
    console.error('Erro ao enviar push notification:', error.message);
  }
};

/**
 * Envia notificação para múltiplos usuários
 * @param {Array} users - Array de objetos { _id, pushToken }
 * @param {string} title - Título da notificação
 * @param {string} body - Corpo da notificação
 * @param {Object} data - Dados extras
 */
const sendPushToMultiple = async (users, title, body, data = {}) => {
  try {
    console.log(`📤 Enviando notificação para ${users.length} usuário(s)`);
    console.log(`   Título: ${title}`);
    console.log(`   Corpo: ${body}`);
    
    const notifications = [];
    const pushMessages = [];

    for (const user of users) {
      // Salvar no banco
      notifications.push({
        userId: user._id,
        title,
        body,
        type: data.type || 'general',
        data
      });

      // Preparar push se tiver token
      if (user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
        console.log(`   ✅ Token válido para usuário ${user._id}: ${user.pushToken}`);
        pushMessages.push({
          to: user.pushToken,
          sound: 'default',
          title,
          body,
          data,
          priority: 'high',
        });
      } else {
        console.log(`   ⚠️ Token inválido ou ausente para usuário ${user._id}: ${user.pushToken}`);
      }
    }

    // Salvar todas as notificações no banco
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`   💾 ${notifications.length} notificação(ões) salva(s) no banco`);
    }

    // Enviar push notifications em lote
    if (pushMessages.length > 0) {
      console.log(`   🚀 Enviando ${pushMessages.length} push notification(s)...`);
      const chunks = expo.chunkPushNotifications(pushMessages);
      for (const chunk of chunks) {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        console.log(`   📨 Tickets recebidos:`, JSON.stringify(tickets, null, 2));
      }
    } else {
      console.log(`   ⚠️ Nenhum push token válido encontrado`);
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificações em lote:', error.message);
    console.error(error);
  }
};

/**
 * Cria apenas notificação no banco (sem push)
 * @param {string} userId - ID do usuário
 * @param {string} title - Título
 * @param {string} body - Corpo
 * @param {string} type - Tipo da notificação
 * @param {Object} data - Dados extras
 */
const createNotification = async (userId, title, body, type = 'general', data = {}) => {
  try {
    await Notification.create({
      userId,
      title,
      body,
      type,
      data
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error.message);
  }
};

module.exports = {
  sendPushNotification,
  sendPushToMultiple,
  createNotification,
};
