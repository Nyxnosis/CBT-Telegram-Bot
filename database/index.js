const fs = require('fs');
const path = require('path');
const UsersDBPath = path.join(__dirname, 'examUsers.json');
const QuestionsDBPath = path.join(__dirname, 'questions');

// Ensure both JSON files exist before reading
if (!fs.existsSync(UsersDBPath)) throw new Error('Users database not found!');
let UsersDB = JSON.parse(fs.readFileSync(UsersDBPath, 'utf-8'));

const addToDB = (data) => {
    if (!data) throw new Error('❌ Missing data');
    chatId = data.chatId;
    UsersDB[chatId] = {
        ...UsersDB[chatId],
        ...data
    };
    fs.writeFileSync(UsersDBPath, JSON.stringify(UsersDB, null, 2));
};


const getUser = (chatId) => {
    if (!chatId) throw new Error('❌ chatId is required to get user');

    if (!UsersDB[chatId]) {
        UsersDB[chatId] = {
            chatId,
            score: 0,
            points: 0,
            firstName: null,
            category: null,
            sub_category: null,
            module: null,
            examStarted: false,
            currentQuestion: 0,
            answers: []
        };
        fs.writeFileSync(UsersDBPath, JSON.stringify(UsersDB, null, 2));
    }

    return UsersDB[chatId];
};

const getQuestions = (user) => {
    if (user.category && user.sub_category) {
        const questionsFilePath = path.join(QuestionsDBPath, user.category, `${user.sub_category}.json`);
        
        if (fs.existsSync(questionsFilePath)) {
            const data = require(questionsFilePath); // Load the correct file dynamically

            if (user.module === 'random' || !user.module) {
                // Return all questions from all modules
                return data.flatMap(module => module.quizWrap);
            } else {
                // Define a normalization function
                const normalize = (str) =>
                    str.toLowerCase()
                       .replace(/\s+/g, '_')        // replace spaces with _
                       .replace(/[^a-z0-9_]/g, '')   // remove special characters
                       .slice(0, 50);                // limit length if needed

                const cleanedModule = normalize(user.module);

                const module = data.find(mod => {
                    const cleanedModName = normalize(mod.module);
                    return cleanedModName === cleanedModule;
                });

                console.log('Matched Module:', module?.module || 'None');

                return module ? module.quizWrap : [];
            }
        }
    }
    return [];
};


module.exports = {
    UsersDB,
    addToDB,
    getUser,
    getQuestions,
};
