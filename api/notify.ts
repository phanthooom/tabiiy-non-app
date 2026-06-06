import type { VercelRequest, VercelResponse } from '@vercel/node';

const STATUS_LABELS: Record<string, string> = {
  accepted: '✅ Принят',
  packing: '📦 Упаковывается',
  courier_assigned: '🚗 Курьер в пути',
  delivered: '✅ Доставлен',
  cancelled: '❌ Отменён',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Проверяем метод
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Получаем токен из переменных окружения Vercel
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is not set in Vercel environment variables');
    // Не возвращаем ошибку клиенту, чтобы не ломать админку, просто логируем
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
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).json({ error: 'Failed to send telegram message', details: data });
    }

    return res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
