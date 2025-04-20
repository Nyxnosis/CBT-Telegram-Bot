require('dotenv').config(); // Loads .env
module.exports = {
    TELEGRAM_BOT_TOKEN: (process.env.TELEGRAM_BOT_TOKEN || '').trim(),
    WELCOME_MSG: '👋 Hello *{name}*,\n\nWelcome to *CBT Exam Bot* 🎯\n\nSend /help for help\n\nSelect your exam category below to begin practicing:\n\n✅ Practice Questions\n\n🏆 Leaderboard\n\n📈 Daily Challenge\n\n*Let’s level up your knowledge!* 🚀\n\nPlease choose a category:',
    NUMBER_OF_QNS: 50,
}