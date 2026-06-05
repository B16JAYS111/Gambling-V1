// Complete animated slots engine
let isSpinning = false;

document.getElementById('spin-slots-btn').onclick = function() {
    if (isSpinning) return; // Prevent double clicking while spinning

    const balanceEl = document.getElementById('player-balance');
    const betInput = document.getElementById('global-bet');
    
    let balance = parseInt(balanceEl.innerText);
    let currentBet = parseInt(betInput.value);

    if (isNaN(currentBet) || currentBet <= 0) {
        alert("Please enter a valid bet amount!");
        return;
    }
    if (balance < currentBet) {
        alert("Insufficient balance for this bet!");
        return;
    }

    // Deduct the customizable bet size
    balanceEl.innerText = balance - currentBet;
    isSpinning = true;

    const symbols = ['🍒', '🍋', '💎', '7️⃣', '🔔', '🍀'];
    let spinCount = 0;
    
    // Create rolling cycle visual timer loop
    const spinInterval = setInterval(() => {
        document.getElementById('reel1').innerText = symbols[Math.floor(Math.random() * symbols.length)];
        document.getElementById('reel2').innerText = symbols[Math.floor(Math.random() * symbols.length)];
        document.getElementById('reel3').innerText = symbols[Math.floor(Math.random() * symbols.length)];
        
        spinCount++;
        if (spinCount > 15) { // Stop rolling after 15 shuffles
            clearInterval(spinInterval);
            isSpinning = false;
            checkSlotResults(currentBet);
        }
    }, 100);
};

function checkSlotResults(betSize) {
    const r1 = document.getElementById('reel1').innerText;
    const r2 = document.getElementById('reel2').innerText;
    const r3 = document.getElementById('reel3').innerText;
    const balanceEl = document.getElementById('player-balance');

    if (r1 === r2 && r2 === r3) {
        let winAmount = betSize * 20; // 20x Jackpot payout multiplier
        alert(`JACKPOT! Three of a kind! You won $${winAmount}!`);
        balanceEl.innerText = parseInt(balanceEl.innerText) + winAmount;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        let winAmount = betSize * 2; // 2x minor pair multiplier
        alert(`Pair! You won $${winAmount}!`);
        balanceEl.innerText = parseInt(balanceEl.innerText) + winAmount;
    }
}
