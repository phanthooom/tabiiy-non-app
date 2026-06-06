import axios from 'axios';

const BOT_TOKEN = '8957857177:AAFNSzeeQR7NTZHoQ7BbKajJhQyfKrizJSU';
const FIRESTORE_PROJECT_ID = 'tabiiy-non';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  if (!BOT_TOKEN) return res.status(200).send('OK');

  try {
    const update = req.body;
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      const contact = update.message.contact;

      if (text === '/start') {
        // Отправляем приветствие и просим номер телефона
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: 'Добро пожаловать в Tabiiy Non! 🍞\n\nДля того чтобы делать заказы, нам нужен ваш номер телефона. Пожалуйста, нажмите кнопку ниже 👇',
          reply_markup: {
            keyboard: [
              [{ text: '📱 Отправить номер', request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      } else if (contact) {
        // Сохраняем телефон в Firestore
        let phone = contact.phone_number;
        if (!phone.startsWith('+')) phone = '+' + phone;
        
        const telegramId = contact.user_id || chatId;
        const firstName = update.message.from?.first_name || '';
        const lastName = update.message.from?.last_name ? ' ' + update.message.from.last_name : '';
        const fullName = firstName + lastName;
        const username = update.message.from?.username || '';

        // Используем Firebase REST API для upsert'а профиля
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${telegramId}?updateMask.fieldPaths=phone&updateMask.fieldPaths=full_name&updateMask.fieldPaths=username`;
        
        await axios.patch(firestoreUrl, {
          fields: {
            phone: { stringValue: phone },
            full_name: { stringValue: fullName },
            username: { stringValue: username }
          }
        });

        // Отправляем подтверждение и кнопку магазина
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          chat_id: chatId,
          text: 'Спасибо! Ваш номер сохранен. ✅\n\nТеперь вы можете открыть магазин и сделать заказ.',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🛒 Открыть магазин', web_app: { url: 'https://tabiiy-non-app.vercel.app/' } }]
            ]
          }
        });
      }
    }

    return res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook error:', e?.response?.data || e.message);
    // Всегда возвращаем 200, чтобы Telegram не пытался повторить запрос вечно
    return res.status(200).send('OK');
  }
}
