require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const app = express();
const TelegramBot = require('node-telegram-bot-api');

app.use(express.static('public'));
app.use(express.json());

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Verify Telegram authentication
const verifyTelegramData = (telegramData) => {
    const secret = crypto.createHash('sha256')
        .update(process.env.TELEGRAM_BOT_TOKEN)
        .digest();
    
    const dataToCheck = Object.keys(telegramData)
        .filter(key => key !== 'hash')
        .map(key => `${key}=${telegramData[key]}`)
        .sort()
        .join('\n');
    
    const hash = crypto.createHmac('sha256', secret)
        .update(dataToCheck)
        .digest('hex');
    
    return hash === telegramData.hash;
};

app.post('/save-score', (req, res) => {
    if (!verifyTelegramData(req.body.initData)) {
        return res.status(403).json({ error: 'Invalid authentication' });
    }
    
    const { score, userId } = req.body;
    // Add database logic here
    res.json({ success: true });
});

app.post('/bot-init', (req, res) => {
    const { initData } = req.body;
    if (!verifyTelegramData(initData)) {
        return res.status(403).json({ error: 'Invalid authentication' });
    }
    
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Add these after existing routes
app.post('/withdraw', (req, res) => {
    if (!verifyTelegramData(req.body.initData)) {
        return res.status(403).json({ error: 'Invalid authentication' });
    }
    
    const { amount, userId } = req.body;
    const coinsNeeded = amount * 1000;
    
    // Check user balance (replace with database check)
    if (userBalances[userId] < coinsNeeded) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Deduct coins and process payment (implement actual payment gateway)
    userBalances[userId] -= coinsNeeded;
    // Add payment processing logic here
    
    res.json({ success: true, message: `₹${amount} withdrawal initiated` });
});

app.post('/watch-ad', (req, res) => {
    if (!verifyTelegramData(req.body.initData)) {
        return res.status(403).json({ error: 'Invalid authentication' });
    }
    
    const { userId } = req.body;
    // Reward user for watching ad
    userBalances[userId] += 50;
    
    res.json({ success: true, reward: 50 });
});

// Temporary in-memory storage (replace with database)
const userBalances = {};
const userWithdrawals = {};