const path = require('path');
const fs = require('fs');
const QuestionsDBPath = path.join(__dirname, '../database/questions');

const mainCategoryOptions = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '📘 PSC', callback_data: 'category_psc' },
                { text: '🛠️ ITI', callback_data: 'category_iti' }
            ],
            [
                { text: '🪖 ARMY', callback_data: 'category_army' },
                { text: '⚓ NAVY', callback_data: 'category_navy' }
            ],
            [
                { text: "🚃 Indian Railway", callback_data: 'category_indian_railway' },
                { text: '📊 General Knowledge', callback_data: 'category_gk' }
            ]
        ]
    }
};

const subCategoryOptions = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: '🔧 Yr 1 - Fitter', callback_data: 'trade_fitter_1' },
                { text: '🔧 Yr 2 - Fitter', callback_data: 'trade_fitter_2' }
            ],
            [
                { text: '⚡Yr 1 - Electrician', callback_data: 'trade_electrician_1' },
                { text: '⚡Yr 2 - Electrician', callback_data: 'trade_electrician_2' }
            ],
            [
                { text: '🚗 Yr 1 - MMV', callback_data: 'trade_mmv_1' },
                { text: '🚗 Yr 2 - MMV', callback_data: 'trade_mmv_2' }
            ],
            [
                { text: '🖨️ Yr 1 - D Civil', callback_data: 'trade_draughtsman_civil_1' },
                { text: '🖨️ Yr 2 - D Civil', callback_data: 'trade_draughtsman_civil_2' }
            ],
            [
                { text: '🏗️ Welder', callback_data: 'trade_welder' },
                { text: '🏗️ Carpenter', callback_data: 'trade_carpenter' }
            ],
            [
                { text: '💻 COPA', callback_data: 'trade_copa' },
                { text: '🛠️ Mechanic Diesel', callback_data: 'trade_mechanic_diesel' }
            ],
            [
                { text: '📓 ES Year 1', callback_data: 'trade_es_1' },
                { text: '📓 ES Year 2', callback_data: 'trade_es_2' }
            ],
            [
                { text: '🔙 Back to Categories', callback_data: 'back_to_main_category' }
            ]
        ]
    }
};

const levelOptions = {
    reply_markup: {
        inline_keyboard: [
            [
                { text: 'Easy', callback_data: 'level_easy' },
                { text: 'Medium', callback_data: 'level_medium' },
                { text: 'Hard', callback_data: 'level_hard' }
            ],
            [
                { text: '🔙 Back to Categories', callback_data: 'back_to_main_category' }
            ]
        ]
    }
};


const moduleOptions = (user) => {
    const options = {
        reply_markup: {
            inline_keyboard: []
        }
    };

    if (user.category && user.sub_category) {
        const questionsFilePath = path.join(QuestionsDBPath, user.category, `${user.sub_category}.json`);

        if (fs.existsSync(questionsFilePath)) {
            const data = require(questionsFilePath);

            if (Array.isArray(data) && data.length > 0) {
                const moduleButtons = data.map(mod => {
                    const modName = mod.module;
                    return [
                        {
                            text: modName,
                            callback_data: 'module_' + modName.toLowerCase()
                                .replace(/\s+/g, '_')
                                .replace(/[^a-z0-9_]/g, '')
                                .slice(0, 50)
                        }
                    ];
                });

                moduleButtons.push([
                    { text: 'Random 🎲', callback_data: 'module_random' }
                ]);

                options.reply_markup.inline_keyboard = moduleButtons;
            } else {
                options.reply_markup.inline_keyboard = [[
                    { text: '❌ No modules found.', callback_data: 'back_to_main_category' }
                ]];
            }
        } else {
            options.reply_markup.inline_keyboard = [[
                { text: '❌ Module data missing!', callback_data: 'back_to_main_category' }
            ]];
        }

    }

    return options;
};

module.exports = {
    mainCategoryOptions,
    subCategoryOptions,
    levelOptions,
    moduleOptions
}