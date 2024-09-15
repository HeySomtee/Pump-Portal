const TelegramBot = require('node-telegram-bot-api');
const connectDB = require('./config/db');
const Pump = require('./models/Pump');
const checkContractAddressAndPrompt = require('./helpers/readCA')
require('dotenv').config();

connectDB();

// Create the bot instance
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Set up slash commands and their descriptions
bot.setMyCommands([
    { command: '/start', description: 'Start the bot and show default mini apps' },
    { command: '/open', description: 'Open and list your mini apps' },
    { command: '/add', description: 'Add a new mini app (format: [name] [url])' },
    { command: '/remove', description: 'Remove a mini app' }
]);

// Default mini apps that all users will have when they start
const defaultWebApps = [
    { name: 'Dex Screener', url: 'https://dexscreener.com/' },
    { name: 'Sun Pump', url: 'https://sunpump.meme/' },
    { name: 'Pump Fun', url: 'https://pump.fun/' }
];

// Track user input for adding/removing sites
const userState = {};

// Helper function to create a grid layout for apps
function createGridLayout(apps) {
    const grid = [];

    // Create rows of three apps each
    for (let i = 0; i < apps.length; i += 3) {
        const row = [];
        row.push({ text: apps[i].name, web_app: { url: apps[i].url } });

        if (apps[i + 1]) {
            row.push({ text: apps[i + 1].name, web_app: { url: apps[i + 1].url } });
        }

        if (apps[i + 2]) {
            row.push({ text: apps[i + 2].name, web_app: { url: apps[i + 2].url } });
        }

        grid.push(row);
    }

    return grid;
}

// Handle /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check if the user already has apps in the database
    let userRecord = await Pump.findOne({ userId });

    if (!userRecord) {
        // If no record found, it's a new user. Add default apps for them.
        try {
            userRecord = new Pump({ userId, apps: defaultWebApps });
            await userRecord.save();
            bot.sendMessage(chatId, 'Welcome! Default mini apps have been added to your account.');
        } catch (err) {
            console.error('Error adding default apps:', err);
            return bot.sendMessage(chatId, 'An error occurred while setting up your account.');
        }
    }

    // Fetch apps for this user and display them in grid layout
    const options = {
        reply_markup: {
            inline_keyboard: createGridLayout(userRecord.apps)
        }
    };

    // Send the message with mini app buttons
    bot.sendMessage(chatId, 'Select a mini app to open:', options);
});

// Handle /open command
bot.onText(/\/open/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Fetch the user's apps from the database
    const userRecord = await Pump.findOne({ userId });

    if (!userRecord || userRecord.apps.length === 0) {
        return bot.sendMessage(chatId, 'You have no mini apps. Add some using /add.');
    }

    // Display the apps in grid layout
    const options = {
        reply_markup: {
            inline_keyboard: createGridLayout(userRecord.apps)
        }
    };

    // Send the message with mini app buttons
    bot.sendMessage(chatId, 'Here are your mini apps:', options);
});

// Handle /add command
bot.onText(/\/add/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    bot.sendMessage(chatId, 'Please provide the name and URL in the following format: [name] [url]');
    userState[userId] = 'awaiting_site_info';
});

// Capture the name and URL after the /add command
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Handle adding a mini app
    if (userState[userId] === 'awaiting_site_info') {
        const userInput = msg.text.split(' ');

        if (userInput.length !== 2) {
            return bot.sendMessage(chatId, 'Invalid format. Please provide both the name and the URL.');
        }

        const name = userInput[0];
        let url = userInput[1];

        // Ensure the URL starts with https://
        if (!url.startsWith('https://')) {
            if (!url.startsWith('http://')) {
                url = `https://${url}`;
            } else {
                url = url.replace('http://', 'https://');
            }
        }

        try {
            // Find the user's record and add the new app
            const userRecord = await Pump.findOne({ userId });
            userRecord.apps.push({ name, url });
            await userRecord.save();

            bot.sendMessage(chatId, `${name} has been added with URL: ${url}`);
        } catch (err) {
            bot.sendMessage(chatId, 'Error adding the mini app.');
            console.error(err);
        }

        // Clear the state
        delete userState[userId];
    }

    // Handle removing a mini app
    else if (userState[userId] === 'awaiting_remove_info') {
        const appToRemove = msg.text.toLowerCase();

        try {
            // Find the user's record
            const userRecord = await Pump.findOne({ userId });
            
            // Remove the app (case-insensitive)
            const updatedApps = userRecord.apps.filter(app => app.name.toLowerCase() !== appToRemove);
            
            if (updatedApps.length === userRecord.apps.length) {
                delete userState[userId]
                return bot.sendMessage(chatId, `App "${msg.text}" not found.`);
            }

            userRecord.apps = updatedApps;
            await userRecord.save();

            bot.sendMessage(chatId, `The app "${msg.text}" has been removed.`);
        } catch (err) {
            bot.sendMessage(chatId, 'Error removing the mini app.');
            console.error(err);
        }

        // Clear the state
        delete userState[userId];
    }
});

// Handle /remove command
bot.onText(/\/remove/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    bot.sendMessage(chatId, 'Please provide the name of the app to remove.');
    userState[userId] = 'awaiting_remove_info';
});

// Use the function when a message is received
bot.on('message', (msg) => {    
    if (!userState[msg.from.id]) {
        checkContractAddressAndPrompt(msg, bot);
    }
});

// Log that the bot is running
console.log('Bot is running');
