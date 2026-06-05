# 🍞 Tabiiy Non — Mini App Frontend

**React 18 + TypeScript + Vite + Framer Motion + Zustand + TanStack Query**

---

## Структура

```
src/
├── api/index.ts          # Axios клиент + все API вызовы
├── components/
│   ├── AuthProvider.tsx  # Telegram initData → JWT при старте
│   ├── layout/
│   │   └── BottomNav.tsx # Нижняя навигация с бейджем корзины
│   └── ui/index.tsx      # Button, Spinner, Badge, ProductCard, Stepper
├── hooks/
│   └── useTelegram.ts    # useBackButton, useMainButton, useTelegram
├── pages/
│   ├── CatalogPage.tsx   # Каталог товаров
│   ├── CartPage.tsx      # Корзина
│   ├── CheckoutPage.tsx  # Оформление заказа
│   ├── OrdersPage.tsx    # История + детали + Success
│   └── ProfilePage.tsx   # Профиль, язык, телефон
├── store/index.ts        # Zustand: auth, cart, language
├── types/index.ts        # TypeScript типы + Telegram SDK типы
└── utils/i18n.ts         # ru / uz переводы
```
 
---

## Запуск

```bash
# Установить зависимости
npm install

# Dev сервер (с proxy на localhost:8000)
npm run dev

# Production сборка
npm run build
```

---

## Деплой

```bash
npm run build

# Скопировать dist/ на сервер
rsync -avz dist/ user@server:/var/www/tabiiy-non/

# Применить nginx.conf
```

---

## Как работает авторизация

1. Пользователь открывает Mini App
2. `AuthProvider` берёт `window.Telegram.WebApp.initData`
3. Отправляет на `POST /api/auth/telegram`
4. Бэкенд проверяет HMAC подпись → возвращает JWT
5. JWT сохраняется в localStorage и используется во всех запросах


## Регистрация Mini App в BotFatherasd

```
/newapp — создать новое приложение
Web App URL: https://your-domain.com
```





 через команду   бота: `@BotFather → /mybots → ваш бот → Bot Settings → Menu Button → Edit Menu Button URL`
