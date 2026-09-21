/**
 * CLASSIC JACKS OR BETTER - VIDEO POKER ENGINE
 * File: video-poker.js
 */

class VideoPokerEngine {
    constructor() {
        this.canvas = document.getElementById('pokerCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Game Configuration & State
        this.deck = [];
        this.hand = []; // 5 card objects
        this.gameState = 'BETTING'; // 'BETTING', 'HELD_SELECTION', 'GAME_OVER'
        this.bet = 1;
        this.maxBet = 5;
        this.betUnit = 5; // $5 per credit
        this.lastWin = 0;
        this.statusMessage = "PRESS DEAL TO START";

        // Paytable (Multipliers per coin, Index 0 is 1 coin -> Index 4 is 5 coins)
        this.paytable = [
            { name: "Royal Flush",     payouts: [250, 500, 750, 1000, 4000] },
            { name: "Straight Flush",  payouts: [50,  100, 150, 200,  250] },
            { name: "4 of a Kind",     payouts: [25,  50,  75,  100,  125] },
            { name: "Full House",      payouts: [9,   18,  27,  36,   45] },
            { name: "Flush",           payouts: [6,   12,  18,  24,   30] },
            { name: "Straight",        payouts: [4,   8,   12,  16,   20] },
            { name: "3 of a Kind",     payouts: [3,   6,   9,   12,   15] },
            { name: "Two Pair",        payouts: [2,   4,   6,   8,    10] },
            { name: "Jacks or Better", payouts: [1,   2,   3,   4,    5] }
        ];

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.render();
    }

    // ==========================================
    // 1. DECK & CARDS LOGIC
    // ==========================================
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = [
            { val: '2', num: 2 }, { val: '3', num: 3 }, { val: '4', num: 4 },
            { val: '5', num: 5 }, { val: '6', num: 6 }, { val: '7', num: 7 },
            { val: '8', num: 8 }, { val: '9', num: 9 }, { val: '10', num: 10 },
            { val: 'J', num: 11 }, { val: 'Q', num: 12 }, { val: 'K', num: 13 }, { val: 'A', num: 14 }
        ];

        let deck = [];
        for (let suit of suits) {
            for (let v of values) {
                deck.push({
                    value: v.val,
                    numValue: v.num,
                    suit: suit,
                    color: (suit === '♥' || suit === '♦') ? '#e74c3c' : '#2c3e50',
                    held: false
                });
            }
        }
        return deck;
    }

    shuffle(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    // ==========================================
    // 2. GAME CYCLE
    // ==========================================
    handlePrimaryAction() {
        if (this.gameState === 'BETTING' || this.gameState === 'GAME_OVER') {
            this.deal();
        } else if (this.gameState === 'HELD_SELECTION') {
            this.draw();
        }
    }

    deal() {
        const totalWager = this.bet * this.betUnit;
        if (!this.deductBankroll(totalWager)) {
            this.statusMessage = "INSUFFICIENT FUNDS!";
            this.render();
            return;
        }

        this.deck = this.shuffle(this.createDeck());
        this.hand = [];
        for (let i = 0; i < 5; i++) {
            this.hand.push(this.deck.pop());
        }

        this.lastWin = 0;
        this.gameState = 'HELD_SELECTION';
        this.statusMessage = "SELECT CARDS TO HOLD, THEN PRESS DRAW";
        this.updateButtons();
        this.render();
    }

    draw() {
        // Replace non-held cards
        for (let i = 0; i < 5; i++) {
            if (!this.hand[i].held) {
                this.hand[i] = this.deck.pop();
            }
        }

        this.gameState = 'GAME_OVER';
        this.evaluateHand();
        this.updateButtons();
        this.render();
    }

    changeBet(delta) {
        if (this.gameState === 'HELD_SELECTION') return;
        this.bet += delta;
        if (this.bet > this.maxBet) this.bet = 1;
        if (this.bet < 1) this.bet = this.maxBet;
        this.render();
    }

    setBetMax() {
        if (this.gameState === 'HELD_SELECTION') return;
        this.bet = this.maxBet;
        this.deal();
    }

    // ==========================================
    // 3. HAND EVALUATION (JACKS OR BETTER)
    // ==========================================
    evaluateHand() {
        const values = this.hand.map(c => c.numValue).sort((a, b) => a - b);
        const suits = this.hand.map(c => c.suit);

        const isFlush = suits.every(s => s === suits[0]);
        let isStraight = false;

        if (new Set(values).size === 5) {
            if (values[4] - values[0] === 4) isStraight = true;
            // Ace-Low Straight (A-2-3-4-5)
            if (values[4] === 14 && values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5) {
                isStraight = true;
            }
        }

        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const freq = Object.values(counts).sort((a, b) => b - a);

        let resultRank = -1;

        if (isFlush && isStraight) {
            resultRank = values[4] === 14 && values[3] === 13 ? 0 : 1; // Royal or Straight Flush
        } else if (freq[0] === 4) {
            resultRank = 2; // 4 of a Kind
        } else if (freq[0] === 3 && freq[1] === 2) {
            resultRank = 3; // Full House
        } else if (isFlush) {
            resultRank = 4; // Flush
        } else if (isStraight) {
            resultRank = 5; // Straight
        } else if (freq[0] === 3) {
            resultRank = 6; // 3 of a Kind
        } else if (freq[0] === 2 && freq[1] === 2) {
            resultRank = 7; // Two Pair
        } else if (freq[0] === 2) {
            // Check if pair is Jacks or Better (11, 12, 13, 14)
            const pairVal = parseInt(Object.keys(counts).find(k => counts[k] === 2));
            if (pairVal >= 11) resultRank = 8;
        }

        if (resultRank !== -1) {
            const handInfo = this.paytable[resultRank];
            const multiplier = handInfo.payouts[this.bet - 1];
            this.lastWin = multiplier * this.betUnit;
            this.awardBankroll(this.lastWin);
            this.statusMessage = `${handInfo.name.toUpperCase()}! YOU WIN $${this.lastWin}!`;
        } else {
            this.statusMessage = "GAME OVER - NO WINNING HAND";
        }
    }

    // ==========================================
    // 4. CANVAS GRAPHICS & RENDERING
    // ==========================================
    toggleHoldCard(index) {
        if (this.gameState !== 'HELD_SELECTION') return;
        this.hand[index].held = !this.hand[index].held;
        this.render();
    }

    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        this.ctx.fillStyle = '#0f2027';
        this.ctx.fillRect(0, 0, w, h);

        // Paytable Header
        this.drawPaytable(w);

        // Draw 5 Cards
        const cardW = 100;
        const cardH = 140;
        const startX = (w - (5 * cardW + 4 * 15)) / 2;
        const cardY = 230;

        for (let i = 0; i < 5; i++) {
            const x = startX + i * (cardW + 15);
            const card = this.hand[i];
            this.drawCard(card, x, cardY, cardW, cardH, i);
        }

        // Status & Credit Banner
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = 'bold 18px "Courier New", monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.statusMessage, w / 2, 410);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px sans-serif';
        this.ctx.fillText(`CURRENT BET: ${this.bet} COIN(S) ($${this.bet * this.betUnit})`, w / 2, 435);
    }

    drawPaytable(width) {
        const startY = 15;
        const rowH = 18;
        this.ctx.font = '12px sans-serif';

        this.paytable.forEach((row, idx) => {
            const y = startY + (idx * rowH);
            
            // Highlight active hand ranking payout column
            this.ctx.fillStyle = idx % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent';
            this.ctx.fillRect(10, y - 12, width - 20, rowH);

            // Hand Name
            this.ctx.fillStyle = '#00d2d3';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(row.name, 20, y);

            // Payout values for 1-5 coins
            for (let c = 0; c < 5; c++) {
                const payoutX = width - 220 + (c * 40);
                this.ctx.textAlign = 'right';
                if (this.bet === (c + 1)) {
                    this.ctx.fillStyle = '#f1c40f'; // Highlight active bet column
                } else {
                    this.ctx.fillStyle = '#ffffff';
                }
                this.ctx.fillText(`$${row.payouts[c] * this.betUnit}`, payoutX, y);
            }
        });
    }

    drawCard(card, x, y, w, h, index) {
        this.ctx.save();
        
        // Card Body
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, 8);
        this.ctx.fillStyle = card ? '#ffffff' : '#1e272e';
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = card && card.held ? '#f1c40f' : '#dcdde1';
        this.ctx.stroke();

        if (card) {
            // Held Banner
            if (card.held) {
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.fillRect(x, y - 25, w, 20);
                this.ctx.fillStyle = '#000000';
                this.ctx.font = 'bold 12px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('HELD', x + w / 2, y - 10);
            }

            // Suit and Value
            this.ctx.fillStyle = card.color;
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(card.value, x + 10, y + 30);

            this.ctx.font = '36px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(card.suit, x + w / 2, y + h / 2 + 10);
        } else {
            // Card Back Pattern
            this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            this.ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
        }

        this.ctx.restore();
    }

    // ==========================================
    // 5. DOM & CONTROLS BINDING
    // ==========================================
    attachEventListeners() {
        // Toggle Hold on Card Click
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const cardW = 100, cardH = 140, cardY = 230;
            const startX = (this.canvas.width - (5 * cardW + 4 * 15)) / 2;

            if (clickY >= cardY && clickY <= cardY + cardH) {
                for (let i = 0; i < 5; i++) {
                    const x = startX + i * (cardW + 15);
                    if (clickX >= x && clickX <= x + cardW) {
                        this.toggleHoldCard(i);
                        break;
                    }
                }
            }
        });

        // HTML Button Hookups
        const dealBtn = document.getElementById('poker-deal-btn');
        const betBtn = document.getElementById('poker-bet-btn');
        const maxBtn = document.getElementById('poker-max-btn');

        if (dealBtn) dealBtn.onclick = () => this.handlePrimaryAction();
        if (betBtn) betBtn.onclick = () => this.changeBet(1);
        if (maxBtn) maxBtn.onclick = () => this.setBetMax();
    }

    updateButtons() {
        const dealBtn = document.getElementById('poker-deal-btn');
        if (dealBtn) {
            dealBtn.innerText = this.gameState === 'HELD_SELECTION' ? 'DRAW' : 'DEAL';
        }
    }

    deductBankroll(amt) {
        const el = document.getElementById('player-balance');
        if (!el) return true;
        let bal = parseInt(el.innerText, 10) || 0;
        if (bal < amt) return false;
        el.innerText = bal - amt;
        return true;
    }

    awardBankroll(amt) {
        const el = document.getElementById('player-balance');
        if (el) {
            let bal = parseInt(el.innerText, 10) || 0;
            el.innerText = bal + amt;
        }
    }
}

// Boot-up trigger matched to your wrapper function
function initVideoPoker() {
    window.videoPokerGame = new VideoPokerEngine();
    console.log("Video Poker engine initialized!");
}

window.addEventListener('load', initVideoPoker);
