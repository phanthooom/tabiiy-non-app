const BOT_TOKEN = '8957857177:AAFNSzeeQR7NTZHoQ7BbKajJhQyfKrizJSU';
const FIRESTORE_PROJECT_ID = 'tabiiy-non';
const APP_URL = 'https://tabiiy-non-app.vercel.app/';

const TEXTS = {
  ru: {
    welcome:     'Добро пожаловать в Tabiiy Non! 🍞\n\nДля того чтобы делать заказы, нам нужен ваш номер телефона. Пожалуйста, нажмите кнопку ниже 👇',
    send_phone:  '📱 Отправить номер',
    thanks:      'Спасибо! Ваш номер сохранен. ✅\n\nТеперь вы можете открыть магазин и сделать заказ.',
    open_shop:   '🛒 Открыть магазин',
    menu_button: 'Магазин',
  },
  uz: {
    welcome:     'Tabiiy Non\'ga xush kelibsiz! 🍞\n\nBuyurtma berish uchun telefon raqamingiz kerak. Iltimos, quyidagi tugmani bosing 👇',
    send_phone:  '📱 Raqamni yuborish',
    thanks:      'Rahmat! Raqamingiz saqlandi. ✅\n\nEndi do\'konga kirib buyurtma berishingiz mumkin.',
    open_shop:   '🛒 Do\'konni ochish',
    menu_button: 'Buyurtma',
  },
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const update = req.body;

    if (update.message) {
      const chatId  = update.message.chat.id;
      const text    = update.message.text;
      const contact = update.message.contact;

      if (text === '/start') {
        await tg('sendMessage', {
          chat_id: chatId,
          text: 'Выберите язык / Tilni tanlang 🌐',
          reply_markup: {
            inline_keyboard: [[
              { text: '🇷🇺 Русский',  callback_data: 'lang_ru' },
              { text: '🇺🇿 O\'zbek', callback_data: 'lang_uz' },
            ]]
          }
        });
      } else if (contact) {
        const telegramId = String(contact.user_id || chatId);
        const lang       = await getUserLang(telegramId);
        const t          = TEXTS[lang] ?? TEXTS.ru;

        let phone = contact.phone_number;
        if (!phone.startsWith('+')) phone = '+' + phone;

        const from     = update.message.from ?? {};
        const fullName = [from.first_name, from.last_name].filter(Boolean).join(' ');
        const username = from.username ?? '';

        await saveUserFields(telegramId, { phone, full_name: fullName, username });

        await tg('sendMessage', {
          chat_id: chatId,
          text: t.thanks,
          reply_markup: {
            inline_keyboard: [[
              { text: t.open_shop, web_app: { url: APP_URL } }
            ]]
          }
        });
      }
    }

    if (update.callback_query) {
      const chatId = update.callback_query.message.chat.id;
      const data   = update.callback_query.data;

      if (data === 'lang_ru' || data === 'lang_uz') {
        const lang = data === 'lang_ru' ? 'ru' : 'uz';
        const t    = TEXTS[lang];

        await saveLang(String(chatId), lang);

        await tg('answerCallbackQuery', { callback_query_id: update.callback_query.id });

        await tg('setChatMenuButton', {
          chat_id: chatId,
          menu_button: {
            type:    'web_app',
            text:    t.menu_button,
            web_app: { url: APP_URL },
          }
        });

        await tg('sendMessage', {
          chat_id: chatId,
          text: t.welcome,
          reply_markup: {
            keyboard: [[{ text: t.send_phone, request_contact: true }]],
            resize_keyboard: true,
            one_time_keyboard: true,
          }
        });
      }
    }

    return res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook error:', e?.message);
    return res.status(200).send('OK');
  }
}

async function tg(method, body) {
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
}

async function getUserLang(telegramId) {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${telegramId}`;
    const res = await fetch(url);
    if (!res.ok) return 'ru';
    const data = await res.json();
    return data.fields?.language?.stringValue || 'ru';
  } catch {
    return 'ru';
  }
}

async function saveLang(telegramId, lang) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${telegramId}?updateMask.fieldPaths=language`;
  await fetch(url, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: { language: { stringValue: lang } } }),
  });
}

async function saveUserFields(telegramId, { phone, full_name, username }) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/users/${telegramId}?updateMask.fieldPaths=phone&updateMask.fieldPaths=full_name&updateMask.fieldPaths=username`;
  await fetch(url, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      fields: {
        phone:     { stringValue: phone },
        full_name: { stringValue: full_name },
        username:  { stringValue: username },
      }
    }),
  });
}
