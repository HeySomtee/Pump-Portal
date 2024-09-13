const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Replace with your bot token
const token = process.env.BOT_TOKEN;

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Set the bot's menu commands
bot.setMyCommands([
    { command: '/open', description: 'Open a web app' },
    { command: '/add', description: 'Add a new web app' },
    { command: '/remove', description: 'Remove a web app' }
]);

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Create the inline keyboard with web app buttons
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Dex Screener',
                        web_app: { url: 'https://dexscreener.com/' }
                    },
                    {
                        text: 'Sun Pump',
                        web_app: { url: 'https://sunpump.meme/' }
                    }
                ],
                [
                    {
                        text: 'Pump Fun',
                        web_app: { url: 'https://pump.fun/' }
                    }
                ]
            ]
        }
    };

    // Send a message with the inline keyboard
    bot.sendMessage(chatId, 'Select a web app to open:', options);
});

// Handle /open command
bot.onText(/\/open/, (msg) => {
    const chatId = msg.chat.id;

    // Send a message listing the available apps
    const options = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Dex Screener',
                        web_app: { url: 'https://dexscreener.com/' }
                    },
                    {
                        text: 'Sun Pump',
                        web_app: { url: 'https://sunpump.meme/' }
                    }
                ],
                [
                    {
                        text: 'Pump Fun',
                        web_app: { url: 'https://pump.fun/' }
                    }
                ]
            ]
        }
    };

    bot.sendMessage(chatId, 'Which app would you like to open?', options);
});

const addSiteState = {};

// Handle /add command (step 1: prompt the user to enter name and URL)
bot.onText(/\/add/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Send a message asking the user to enter the name and URL
    bot.sendMessage(chatId, 'Please provide the name and URL in the following format: [name] [url]');

    // Set the state to track that the bot is awaiting input from this user
    addSiteState[userId] = 'awaiting_site_info';
});

// Handle user's next message (step 2: capture name and URL)
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check if the user is in the state of adding a new site
    if (addSiteState[userId] === 'awaiting_site_info') {
        const userInput = msg.text.split(' ');

        // Validate input format
        if (userInput.length !== 2) {
            bot.sendMessage(chatId, 'Invalid format. Please provide both the name and the URL in the format: [name] [url]');
            return;
        }

        const name = userInput[0];
        const url = userInput[1];

        // Acknowledge the added site
        bot.sendMessage(chatId, `${name} has been added with URL: ${url}`);

        // Clear the user's state after capturing the input
        delete addSiteState[userId];
    }
});



// Handle /remove command
bot.onText(/\/remove (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const siteName = match[1];

    // Remove the site (for now, just acknowledge it; you would persist changes in a database for real usage)
    bot.sendMessage(chatId, `${siteName} has been removed.`);
});

// Start the bot
console.log('Bot is running...');
