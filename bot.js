const config = require('./config.js');
const TelegramBot = require('node-telegram-bot-api');

const token = config.TELEGRAM_BOT_TOKEN;

if (!token) {
    throw new Error('🚫 TELEGRAM_BOT_TOKEN not found in .env');
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Bot is up and polling...');
console.log('Token : ', token);

module.exports = bot;