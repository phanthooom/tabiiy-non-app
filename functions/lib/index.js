"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.onOrderUpdate = exports.authWithTelegram = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto-js");
admin.initializeApp();
// 1. Авторизация через Telegram initData
exports.authWithTelegram = functions.https.onCall(async (data, context) => {
    var _a;
    const { initData } = data;
    if (!initData) {
        throw new functions.https.HttpsError("invalid-argument", "No initData provided");
    }
    // Извлекаем токен бота из конфигурации Firebase (мы его зададим позже через CLI)
    // Для тестирования можно пока использовать process.env, но лучше firebase config
    const botToken = ((_a = functions.config().telegram) === null || _a === void 0 ? void 0 : _a.bot_token) || "8957857177:AAFNSzeeQR7NTZHoQ7BbKajJhQyfKrizJSU";
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get("hash");
    urlParams.delete("hash");
    const keys = Array.from(urlParams.keys()).sort();
    const dataCheckString = keys.map((key) => `${key}=${urlParams.get(key)}`).join("\n");
    const secretKey = crypto.HmacSHA256(botToken, "WebAppData");
    const calculatedHash = crypto.HmacSHA256(dataCheckString, secretKey).toString(crypto.enc.Hex);
    if (calculatedHash !== hash) {
        throw new functions.https.HttpsError("unauthenticated", "Invalid Telegram hash");
    }
    const userStr = urlParams.get("user");
    if (!userStr) {
        throw new functions.https.HttpsError("invalid-argument", "No user data found");
    }
    const user = JSON.parse(userStr);
    const telegramId = String(user.id);
    try {
        // Выдаем Custom Token для Firebase Auth
        const customToken = await admin.auth().createCustomToken(telegramId);
        return { token: customToken, user };
    }
    catch (error) {
        console.error("Error creating custom token:", error);
        throw new functions.https.HttpsError("internal", "Error creating token");
    }
});
// 2. Уведомление в Telegram об изменении статуса заказа
exports.onOrderUpdate = functions.firestore
    .document("orders/{orderId}")
    .onUpdate(async (change, context) => {
    var _a;
    const newData = change.after.data();
    const previousData = change.before.data();
    // Проверяем, изменился ли статус
    if (newData.status === previousData.status) {
        return null;
    }
    const orderId = context.params.orderId;
    const statusText = newData.status_label || newData.status;
    const telegramId = newData.user_id;
    if (!telegramId) {
        console.log("No telegramId found for order", orderId);
        return null;
    }
    const message = `📦 *Обновление заказа #${orderId}*\n\nСтатус вашего заказа изменён на: *${statusText}*\nСумма: ${newData.total_amount} сум\n\nСпасибо, что выбираете Tabiiy Non! 🍞`;
    const botToken = ((_a = functions.config().telegram) === null || _a === void 0 ? void 0 : _a.bot_token) || "8957857177:AAFNSzeeQR7NTZHoQ7BbKajJhQyfKrizJSU";
    try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: telegramId,
                text: message,
                parse_mode: "Markdown",
            }),
        });
        if (!response.ok) {
            console.error("Failed to send Telegram message", await response.text());
        }
    }
    catch (e) {
        console.error("Error sending Telegram message:", e);
    }
    return null;
});
// 3. Автоматическая выдача прав администратора
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    if (user.email === 'admin@tabiiy-non.uz') {
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`Granted admin claim to ${user.email}`);
    }
});
//# sourceMappingURL=index.js.map