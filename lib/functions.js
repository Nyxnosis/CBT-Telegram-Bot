const { UsersDB } = require('../database')

const formatTradeName = (name) => {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const generateLeaderboard = (currentChatId, top = 10) => {
    return Object.entries(UsersDB)
        .sort((a, b) => b[1].points - a[1].points)
        .slice(0, top)
        .map(([chatId, data], index) => {
            const isYou = Number(chatId) === currentChatId;
            const name = data.firstName || `User${chatId.slice(0, 4)}`;
            return `${index + 1}. ${isYou ? '*' : ''}${name}${isYou ? ' (You)*' : ''} - ${data.points} pts`;
        }).join('\n');
};


module.exports = {
    formatTradeName,
    generateLeaderboard
}