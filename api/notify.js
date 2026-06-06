const axios = require('axios');

const STATUS_LABELS = {
  accepted: '✅ Принят',
  packing: '📦 Упаковывается',
  courier_assigned: '🚗 Курьер в пути',
  delivered: '✅ Доставлен',
  cancelled: '❌ Отменён',
};

module.exports = async function handler(req, res) {
  // 1. Проверяем метод
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Получаем токен
  const BOT_TOKEN = '8957857177:AAFNSzeeQR7NTZHoQ7BbKajJhQyfKrizJSU';
  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is not set');
    return res.status(200).json({ success: false, reason: 'No bot token' });
  }

  try {
    const { orderId, telegramId, status, totalAmount } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: 'Missing telegramId' });
    }

    const statusText = STATUS_LABELS[status] || status;
    const message = `📦 *Обновление заказа #${orderId}*\n\nСтатус вашего заказа изменён на: *${statusText}*\nСумма: ${totalAmount} сум\n\nСпасибо, что выбираете Tabiiy Non! 🍞`;

    // 3. Отправляем запрос к Telegram API
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: telegramId,
      text: message,
      parse_mode: 'Markdown',
    });

    return res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error: any) {
    console.error('Error sending notification:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
