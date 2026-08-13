// Quick Slots Engine
document.getElementById('spin-slots-btn').onclick = function() {
    const symbols = ['🍒', '🍋', '💎', '7️⃣', '🔔', '🍀'];
    
    // Deduct bet from balance
    const balanceEl = document.getElementById('player-balance');
    let balance = parseInt(balanceEl.innerText);
    if(balance < 10) { alert("Out of money!"); return; }
    balanceEl.innerText = balance - 10;

    // Pick random symbols
    const r1 = symbols[Math.floor(Math.random() * symbols.length)];
    const r2 = symbols[Math.floor(Math.random() * symbols.length)];
    const r3 = symbols[Math.floor(Math.random() * symbols.length)];

    // Display them
    document.getElementById('reel1').innerText = r1;
    document.getElementById('reel2').innerText = r2;
    document.getElementById('reel3').innerText = r3;

    // Check win conditions
    if (r1 === r2 && r2 === r3) {
        alert("JACKPOT! You won $2m!");
        balanceEl.innerText = parseInt(balanceEl.innerText) + 2000000;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        alert("Two of a kind! You won $20!");
        balanceEl.innerText = parseInt(balanceEl.innerText) + 20;
    }
};
