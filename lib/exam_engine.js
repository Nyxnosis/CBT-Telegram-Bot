// exam_engine.js
const fs = require('fs');
const bot = require('../bot');
const { getUser, addToDB, getQuestions } = require('../database');
const { generatePDFReport } = require('./pdf_generator');
const config = require('../config')
const no_Qns = config.NUMBER_OF_QNS || 2;

// If any case to replace special charecters
// function escapeMarkdown(text) {
//     if (typeof text !== 'string') return text;
  
//     // Replace smart quotes and Unicode punctuation with normal ones
//     text = text
//       .replace(/[‘’‛‹›]/g, `'`)
//       .replace(/[“”„«»]/g, `"`)
//       .replace(/[‐‑‒–—―]/g, '-') // different dashes
//       .replace(/[…]/g, '...');   // ellipsis
  
//     // Escape all MarkdownV2 required symbols
//     return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (match) => '\\' + match);
//   }

function escapeHTML(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  

function startExam(chatId, totalQuestions = no_Qns) {
    const user = getUser(chatId);
    const questions = getQuestionsForUser(user, totalQuestions);
    user.examQuestions = questions;

    user.score = 0;
    user.answers = [];
    user.currentQuestion = 0;
    user.examStarted = true;
    addToDB(user);

    askQuestion(chatId, questions, 0);
}

function getQuestionsForUser(user, count) {
    let allQuestions = getQuestions(user);
    if (allQuestions.length < count) {
        console.warn(`Not enough questions for ${user.category}/${user.sub_category}, Asking *${allQuestions.length}* questions`);
        return shuffleArray(allQuestions).slice(0, allQuestions.length - 1);
    }
    return shuffleArray(allQuestions).slice(0, count); // Pick random N questions
}

function askQuestion(chatId, questions, index) {
    if (index >= questions.length) {
        return sendResult(chatId);
    }

    const question = questions[index];
    const user = getUser(chatId);
    user.currentQuestion = question.id;
    addToDB(user);

    const opts = {
        reply_markup: {
            inline_keyboard: [
                // First row: Horizontal options
                question.options.map((opt, index) => ({
                    text: String.fromCharCode(65 + index),
                    callback_data: `answer_${index}_${question.id}`
                })),
                // Second row: Skip button vertically below
                [
                    {
                        text: escapeHTML('⏭ Skip'),
                        callback_data: `answer_skip_${question.id}`
                    }
                ]
            ]
        },
        parse_mode: 'HTML'
    };


    const escapedQuestion = escapeHTML(question.question);
    const optionsText = question.options.map((opt, index) => {
        const escapedOpt = escapeHTML(opt);
        return `<b>${String.fromCharCode(65 + index)})</b> ${escapedOpt}`;
      }).join('\n');

    const messageText = `<b>Q${index + 1}/${questions.length}:</b> ${escapedQuestion}\n\n${optionsText}`;

    if (question.image_url) {
        // Send image with caption and buttons
        bot.sendPhoto(chatId, question.image_url, {
            caption: messageText,
            ...opts
        });
    } else {
        // Send only text with buttons
        bot.sendMessage(chatId, messageText, opts);
    }
}

function disableOptions(chatId, messageId) {
    bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
}

async function sendResult(chatId) {
    const user = getUser(chatId);
    const total = user.answers.length;
    const correct = user.answers.filter(a => a.correct).length;

    const resultText = `🎉 *Exam Completed!*\n\n*Score:* ${correct}/${total}\n*Correct Answers:* ${correct}\n*Skipped/Wrong:* ${total - correct}`;
    bot.sendMessage(chatId, resultText, { parse_mode: 'Markdown' });

    const pdfPath = await generatePDFReport(user);

    bot.sendDocument(chatId, fs.createReadStream(pdfPath)).then(() => {
        // Delete the PDF file after sending
        if (fs.existsSync(pdfPath)) {
            fs.unlink(pdfPath, (err) => {
                if (!err) {
                    console.log('✅ Temp PDF deleted successfully');
                    clearUserData(user);
                }
            });
        }
    }).catch(err => {
        console.error('❌ Failed to send PDF:', err);
        clearUserData(user);
    });
    user.points += 1;
    addToDB(user);
    await clearUserData(user);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // swap
    }
    return shuffled;
}


async function clearUserData(user) {
    user.answers = [];
    user.score = 0;
    user.currentQuestion = null;
    user.examStarted = false;
    user.examQuestions = [];
    addToDB(user);
}

module.exports = { startExam, disableOptions, sendResult, getQuestionsForUser, askQuestion, clearUserData };
