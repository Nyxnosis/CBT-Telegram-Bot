const bot = require('./bot.js');
const config = require('./config.js');
const { getUser, addToDB } = require('./database');
const { formatTradeName, generateLeaderboard } = require('./lib/functions.js')
const { startExam, disableOptions, askQuestion, clearUserData } = require('./lib/exam_engine.js');
const { mainCategoryOptions, subCategoryOptions, moduleOptions } = require('./lib/categoryOptions.js');

const categories = {
    psc: { icon: '📘', message: 'How will I ask you the questions?' },
    iti: { icon: '🛠️', message: 'Please select your Trade:', customOptions: subCategoryOptions },
    army: { icon: '🪖', message: 'How will I ask you the questions?' },
    navy: { icon: '⚓', message: 'How will I ask you the questions?' },
    gk: { icon: '📊', message: 'How will I ask you the questions?' },
};

bot.onText(/\/start(?:\s+(.+))?/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'User';
    let userData = getUser(chatId);
    const isValid = userData.category && userData.module && userData.sub_category;

    if (!isValid) {
        const welcomeMessage = config.WELCOME_MSG.replace('{name}', firstName);
        return bot.sendMessage(chatId, welcomeMessage, {
            parse_mode: 'Markdown',
            ...mainCategoryOptions,
        });
    }

    if (userData.examStarted) {
        return bot.sendMessage(chatId, '📢 *Exam is already in progress!*\n\nUse /clear to reset your current session if needed.', {
            parse_mode: 'Markdown',
        });
    }
    
    startExam(chatId);
});


bot.onText(/\/change(?:\s+(.+))?/, (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    clearUserData(user);
    bot.sendMessage(chatId, `Please choose a Category:`, { parse_mode: 'Markdown', ...mainCategoryOptions });
});

bot.onText(/\/leaderboard(?:\s+(.+))?/, (msg) => {
    const chatId = msg.chat.id;
    const leaderboard = '🏆 *Leaderboard*\n\n' + generateLeaderboard(chatId, 10);
    bot.sendMessage(chatId, leaderboard, { parse_mode: 'Markdown' });
});

bot.onText(/\/clear(?:\s+(.+))?/, (msg) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    clearUserData(user);
    bot.sendMessage(chatId, `Your currunt exam data cleared, if you want to change exam use /change or if you want to start exam use /start`, { parse_mode: 'Markdown' });
});

bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const messageId = message.message_id;
    const chatId = message.chat.id;
    const firstName = message.chat.first_name || 'User';
    const data = callbackQuery.data;
    // Get or create user
    let user = getUser(chatId);
    if (!user.firstName || user.firstName !== firstName) {
        user.firstName = firstName;
        addToDB(user);
    }

    if (data.startsWith('category')) {
        const key = data.split('category_')[1];
        const info = categories[key];

        if (!info) return bot.sendMessage(chatId, '❌ Invalid selection.');

        user.category = key;
        // Remove below when devolopment is over
        if (key !== 'iti') {
            return bot.answerCallbackQuery(callbackQuery.id, { text: '❌ Sorry! This feature is on devolopment, It will be available soon..', show_alert: true });
        }
        // ..
        if (key !== 'iti') user.sub_category = null; //key;
        addToDB(user);
        bot.answerCallbackQuery(callbackQuery.id);

        bot.editMessageText(`${info.icon} You selected *${key.toUpperCase()}*. ${info.message}`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown', ...info.customOptions,
        });
    } else if (data.startsWith('trade')) {
        let tradeName = data.split('trade_')[1];
        if (tradeName) {
            user.sub_category = tradeName;
            addToDB(user);
            const formattedTrade = formatTradeName(tradeName);
            const moduleOpts = moduleOptions(user) || moduleOptions(getUser(chatId));
            bot.answerCallbackQuery(callbackQuery.id);
            bot.editMessageText(`✅ You selected *${formattedTrade}*. Please select module :`, {
                chat_id: chatId,
                message_id: messageId,
                parse_mode: 'Markdown',
                ...(moduleOpts || {}) // safely spread only if it's defined
            });

        }
    } else if (data.startsWith('module')) {
        let moduleName = data.replace('module_', '');
        console.log(moduleName)

        if (moduleName) {
            user.module = moduleName;
            addToDB(user);
            bot.answerCallbackQuery(callbackQuery.id);
            bot.editMessageText(
                `✅ You have selected ,\nYou can change previous setting using /change command and Use /clear to clear currunt exam data or if you are stucked. Now you can start exam using /start or clicking the button below`,
                {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: `💻 Start ${user.category.toUpperCase()} CBT exam`, callback_data: 'start_exam' }
                            ]
                        ]
                    }
                }
            );
        }
    } else if (data === 'back_to_main_category') {
        bot.answerCallbackQuery(callbackQuery.id);
        bot.editMessageText(`🔙 Please choose a Category:`, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            ...mainCategoryOptions
        });
    } else if (data.startsWith('answer_')) {
        const parts = data.split('_');
        const selected = parts[1];
        const qid = parts[2];
        const isSkipped = selected === 'skip';

        const selectedIndex = isSkipped ? 'skip' : parseInt(selected);
        const questionId = parseInt(qid);

        const user = getUser(chatId);
        const questions = user.examQuestions;

        const currentQ = questions.find(q => q.id == questionId);
        if (!currentQ) {
            return bot.answerCallbackQuery(callbackQuery.id, { text: '⚠️ Question expired or invalid.', show_alert: true });
        }

        if (user.answers.find(ans => ans.id == questionId)) {
            return bot.answerCallbackQuery(callbackQuery.id, { text: '⛔ You already answered this!', show_alert: true });
        }

        const isCorrect = !isSkipped && currentQ.options[selectedIndex] === currentQ.answer;

        disableOptions(chatId, callbackQuery.message.message_id);

        user.score += isCorrect ? 1 : 0;
        user.answers.push({
            id: currentQ.id,
            correct: isCorrect,
            selected: isSkipped ? 'skip' : currentQ.options[selectedIndex]
        });
        addToDB(user);

        bot.answerCallbackQuery(callbackQuery.id, {
            text: isSkipped ? '⏭ Question skipped!' : (isCorrect ? '✅ Correct!' : '❌ Wrong!'),
            show_alert: true
        });

        askQuestion(chatId, questions, user.answers.length);
    } else if (data === 'start_exam') {
        const isValid = user.category && user.module && user.sub_category;
        if (isValid) {
            bot.answerCallbackQuery(callbackQuery.id);
            startExam(chatId);
        } else if (userData.examStarted) {
            bot.sendMessage(chatId, 'Exam is already started, if you want to clear currunt exam use /clear', { parse_mode: 'Markdown' });
        } else {
            bot.answerCallbackQuery(callbackQuery.id, { text: '❌ User details not found', show_alert: true });
        }
    } else {
        bot.answerCallbackQuery(callbackQuery.id, { text: '❌ This button is expired or invalid', show_alert: true });
    }
});

