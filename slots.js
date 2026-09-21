// Slot Engine Configuration
const CONFIG = {
    BET_AMOUNT: 10,
    SPIN_DURATION_BASE: 800, // Duration in ms before first reel stops
    REEL_DELAY: 400,         // Stagger delay between stopping reels
    FRAME_RATE: 50,          // Symbol swap frequency during spin (ms)
    SYMBOLS: [
        { char: '🍒', weight: 30, payout3: 50,  payout2: 10 },
        { char: '🍋', weight: 25, payout3: 100, payout2: 15 },
        { char: '🔔', weight: 20, payout3: 200, payout2: 25 },
        { char: '🍀', weight: 15, payout3: 500, payout2: 50 },
        { char: '💎', weight: 8,  payout3: 1000, payout2: 100 },
        { char: '7️⃣', weight: 2,  payout3: 5000, payout2: 500 }
    ]
};

class SlotEngine {
    constructor() {
        // DOM Elements
        this.balanceEl = document.getElementById('player-balance');
        this.statusEl = document.getElementById('status-message');
        this.spinBtn = document.getElementById('spin-slots-btn');
        this.reelEls = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];

        // State
        this.balance = parseInt(this.balanceEl.innerText, 10) || 100;
        this.isSpinning = false;

        this.init();
    }

    init() {
        this.spinBtn.addEventListener('click', () => this.spin());
    }

    // Pick a weighted random symbol based on odds
    getRandomSymbol() {
        const pool = CONFIG.SYMBOLS;
        const totalWeight = pool.reduce((acc, s) => acc + s.weight, 0);
        let random = Math.floor(Math.random() * totalWeight);

        for (const symbol of pool) {
            if (random < symbol.weight) return symbol;
            random -= symbol.weight;
        }
        return pool[0];
    }

    // Animate a single reel rolling and return the final symbol
    async spinReel(reelEl, duration) {
        const targetSymbol = this.getRandomSymbol();
        const startTime = Date.now();

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                // Cycle temporary random symbols during spin animation
                const randomTemp = CONFIG.SYMBOLS[Math.floor(Math.random() * CONFIG.SYMBOLS.length)];
                reelEl.innerText = randomTemp.char;

                if (Date.now() - startTime >= duration) {
                    clearInterval(interval);
                    reelEl.innerText = targetSymbol.char;
                    resolve(targetSymbol);
                }
            }, CONFIG.FRAME_RATE);
        });
    }

    async spin() {
        if (this.isSpinning) return;
        if (this.balance < CONFIG.BET_AMOUNT) {
            this.updateStatus("Insufficient funds to spin!", "error");
            return;
        }

        // Lock UI & Deduct Bet
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.balance -= CONFIG.BET_AMOUNT;
        this.updateBalance();
        this.updateStatus("Good luck...", "info");

        // Execute sequential reel spins
        const results = await Promise.all(
            this.reelEls.map((reelEl, index) => 
                this.spinReel(reelEl, CONFIG.SPIN_DURATION_BASE + (index * CONFIG.REEL_DELAY))
            )
        );

        // Evaluate payout
        this.evaluateWin(results);

        // Unlock UI
        this.isSpinning = false;
        this.spinBtn.disabled = false;
    }

    evaluateWin(results) {
        const [r1, r2, r3] = results;

        // Three of a kind
        if (r1.char === r2.char && r2.char === r3.char) {
            const prize = r1.payout3;
            this.balance += prize;
            this.updateStatus(`JACKPOT! You matched 3x ${r1.char} and won $${prize}!`, "win");
        } 
        // Two of a kind
        else if (r1.char === r2.char || r2.char === r3.char || r1.char === r3.char) {
            const matchedSymbol = (r1.char === r2.char || r1.char === r3.char) ? r1 : r2;
            const prize = matchedSymbol.payout2;
            this.balance += prize;
            this.updateStatus(`Nice! You matched 2x ${matchedSymbol.char} and won $${prize}!`, "win");
        } 
        // Loss
        else {
            this.updateStatus("No match. Try again!", "loss");
        }

        this.updateBalance();
    }

    updateBalance() {
        this.balanceEl.innerText = this.balance;
    }

    updateStatus(message, type) {
        if (!this.statusEl) return;
        this.statusEl.innerText = message;
        this.statusEl.className = `status-${type}`;
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new SlotEngine();
});
