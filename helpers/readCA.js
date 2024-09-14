// Define regex for the different blockchain addresses
const isSolanaAddress = (address) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && !/^T/.test(address);
const isEthereumAddress = (address) => /^0x[a-fA-F0-9]{40}$/.test(address);
const isTronAddress = (address) => /^T[a-zA-Z0-9]{33}$/.test(address);

// Function to check the contract address and bring up the dialogue
async function checkContractAddressAndPrompt(msg, bot) {
    const chatId = msg.chat.id;
    const text = msg.text;

    let blockchain = null;

    // Check if it's a Solana, Ethereum, or Tron address
    if (isSolanaAddress(text)) {
        blockchain = 'Solana';
    } else if (isEthereumAddress(text)) {
        blockchain = 'Ethereum';
    } else if (isTronAddress(text)) {
        blockchain = 'Tron';
    }

    // If it's a valid contract address
    if (blockchain === 'Solana') {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Pump Fun', web_app: { url: `https://pump.fun/${text}` } },
                        { text: 'Dex Screener', web_app: { url: `https://dexscreener.com/${blockchain.toLowerCase()}/${text}` } }
                    ]
                ]
            }
        };

        // Send the "open with" message
        bot.sendMessage(chatId, `Open with:`, options);
    } else if (blockchain === 'Ethereum') {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Dex Screener', web_app: { url: `https://dexscreener.com/${blockchain.toLowerCase()}/${text}` } }
                    ]
                ]
            }
        };

        // Send the "open with" message
        bot.sendMessage(chatId, `Open with:`, options);

    } else if (blockchain === 'Tron') {
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Sun Pump', web_app: { url: `https://sunpump.meme/token/${text}` } },
                        { text: 'Dex Screener', web_app: { url: `https://dexscreener.com/${blockchain.toLowerCase()}/${text.toLowerCase()}` } }
                    ]
                ]
            }
        };

        // Send the "open with" message
        bot.sendMessage(chatId, `Open with:`, options);

    } else {
        bot.sendMessage(chatId, 'This does not seem to be a valid contract address.');
    }
}

module.exports = checkContractAddressAndPrompt