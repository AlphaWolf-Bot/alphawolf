let score = 0;
let multiplier = 1;
let packLevel = 1;
let territoryLevel = 1;
let balance = 0;
let adCounter = 0;

async function initTelegram() {
    const initData = Telegram.WebApp.initData;
    const response = await fetch('/bot-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData })
    });
    
    if (!response.ok) {
        alert('Authentication failed');
        Telegram.WebApp.close();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    Telegram.WebApp.ready();
    Telegram.WebApp.MainButton.setText('OPEN ALPHA WOLF').show();
    initTelegram();
    
    const wolfButton = document.getElementById('wolf-button');
    const scoreDisplay = document.getElementById('score');
    
    wolfButton.addEventListener('click', () => {
        score += multiplier;
        scoreDisplay.textContent = Math.floor(score);
    });
    
    // Upgrade handlers
    document.getElementById('upgrade-pack').addEventListener('click', () => {
        if (score >= 100) {
            score -= 100;
            multiplier *= 1.2;
            packLevel++;
            updateDisplay();
        }
    });
    
    document.getElementById('upgrade-territory').addEventListener('click', () => {
        if (score >= 500) {
            score -= 500;
            multiplier *= 1.5;
            territoryLevel++;
            updateDisplay();
        }
    });
    
    function updateDisplay() {
        scoreDisplay.textContent = Math.floor(score);
    }
    
    // Auto-save every 30 seconds
    setInterval(async () => {
        await fetch('/save-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                initData: Telegram.WebApp.initData,
                score,
                userId: Telegram.WebApp.initDataUnsafe.user.id
            })
        });
    }, 30000);
    async function loadBalance() {
        const response = await fetch('/get-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                initData: Telegram.WebApp.initData,
                userId: Telegram.WebApp.initDataUnsafe.user.id
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            balance = data.balance;
            document.getElementById('balance').textContent = balance;
        }
    }

    

});


// Add these variables at the top

// Add these inside DOMContentLoaded


// Withdrawal handler
document.getElementById('withdraw-btn').addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('withdraw-amount').value);
    if (!amount || amount < 1) {
        alert('Minimum withdrawal ₹1');
        return;
    }
    
    const response = await fetch('/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            initData: Telegram.WebApp.initData,
            userId: Telegram.WebApp.initDataUnsafe.user.id,
            amount
        })
    });
    
    const result = await response.json();
    alert(result.message || result.error);
    if (result.success) await loadBalance();
});

// Ad watching handler
document.getElementById('watch-ad').addEventListener('click', async () => {
    const response = await fetch('/watch-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            initData: Telegram.WebApp.initData,
            userId: Telegram.WebApp.initDataUnsafe.user.id
        })
    });
    
    if (response.ok) {
        const result = await response.json();
        balance += result.reward;
        document.getElementById('balance').textContent = balance;
        adCounter++;
        
        if (adCounter % 3 === 0) {
            // Show interstitial ad every 3 ads
            Telegram.WebApp.showPopup({
                title: 'Special Offer!',
                message: 'Watch a video for 200 🪙?',
                buttons: [{ id: 'watch', type: 'ok' }, { type: 'cancel' }]
            }, (buttonId) => {
                if (buttonId === 'watch') {
                    // Handle video ad reward
                    balance += 200;
                    document.getElementById('balance').textContent = balance;
                }
            });
        }
    }
});

// Add this to auto-save interval
setInterval(async () => {
    await fetch('/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            initData: Telegram.WebApp.initData,
            score,
            balance,
            userId: Telegram.WebApp.initDataUnsafe.user.id
        })
    });
}, 30000);

// In app.js - For rewarded ads
document.getElementById('watch-ad').addEventListener('click', () => {
    Telegram.WebApp.showPopup({
        title: 'Watch Ad',
        message: 'Watch a short video to earn 200 coins!',
        buttons: [{ id: 'confirm', type: 'default' }, { type: 'cancel' }]
    }, (buttonId) => {
        if (buttonId === 'confirm') {
            // Trigger ad display
            displayRewardedAd().then(() => {
                balance += 200;
                updateBalanceDisplay();
            });
        }
    });
});

function displayRewardedAd() {
    return new Promise((resolve) => {
        // Google AdMob rewarded ad implementation
        if(window.admob) {
            admob.rewarded.load().show();
        } else {
            // Fallback to simple credit
            resolve();
        }
    });
}

// Initialize balance on load
loadBalance();