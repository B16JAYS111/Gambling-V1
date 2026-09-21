/**
 * BLACKJACK CASINO ENGINE
 * File: blackjack.js
 */

class BlackjackEngine {
    constructor() {
        this.canvas = document.getElementById('blackjackCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.gameState = 'IDLE'; // 'IDLE', 'PLAYING', 'DEALER_TURN', 'GAME_OVER'
        this.statusMessage = "PLACE YOUR BET AND PRESS DEAL";

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.render();
    }

    // ==========================================
    // 1. DECK & HAND LOGIC
    // ==========================================
    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = [
            { val: '2', num: 2 }, { val: '3', num: 3 }, { val: '4', num: 4 },
            { val: '5', num: 5 }, { val: '6', num: 6 }, { val: '7', num: 7 },
            { val: '8', num: 8 }, { val: '9', num: 9 }, { val: '10', num: 10 },
            { val: 'J', num: 10 }, { val: 'Q', num: 10 }, { val: 'K', num: 10 }, { val: 'A', num: 11 }
        ];

        let deck = [];
        for (let suit of suits) {
            for (let v of values) {
                deck.push({
                    value: v.val,
                    numValue: v.num,
                    suit: suit,
                    color: (suit === '♥' || suit === '♦') ? '#e74c3c' : '#2c3e50'
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

    calculateScore(hand) {
        let score = hand.reduce((acc, card) => acc + card.numValue, 0);
        let aces = hand.filter(card => card.value === 'A').length;

        // Reduce Ace values from 11 to 1 if score busts
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    // ==========================================
    // 2. GAME CYCLE
    // ==========================================
    dealHand() {
        const bet = this.getGlobalBet();

        if (this.gameState === 'PLAYING') return;

        if (!this.deductBankroll(bet)) {
            this.statusMessage = "INSUFFICIENT FUNDS!";
            this.render();
            return;
        }

        this.deck = this.shuffle(this.createDeck());
        this.playerHand = [this.deck.pop(), this.deck.pop()];
        this.dealerHand = [this.deck.pop(), this.deck.pop()];
        this.gameState = 'PLAYING';

        const playerScore = this.calculateScore(this.playerHand);
        if (playerScore === 21) {
            this.evaluateWinner(true); // Natural Blackjack
        } else {
            this.statusMessage = "HIT OR STAND?";
        }

        this.render();
    }

    hit() {
        if (this.gameState !== 'PLAYING') return;

        this.playerHand.push(this.deck.pop());
        const score = this.calculateScore(this.playerHand);

        if (score > 21) {
            this.gameState = 'GAME_OVER';
            this.statusMessage = `BUSTED WITH ${score}! DEALER WINS.`;
        } else if (score === 21) {
            this.stand(); // Auto-stand on 21
            return;
        } else {
            this.statusMessage = `HAND TOTAL: ${score}. HIT OR STAND?`;
        }

        this.render();
    }

    stand() {
        if (this.gameState !== 'PLAYING') return;

        this.gameState = 'DEALER_TURN';

        // Dealer hits on under 17
        while (this.calculateScore(this.dealerHand) < 17) {
            this.dealerHand.push(this.deck.pop());
        }

        this.evaluateWinner();
        this.render();
    }

    evaluateWinner(naturalBlackjack = false) {
        this.gameState = 'GAME_OVER';
        const playerScore = this.calculateScore(this.playerHand);
        const dealerScore = this.calculateScore(this.dealerHand);
        const bet = this.getGlobalBet();

        if (naturalBlackjack) {
            const payout = Math.round(bet * 2.5); // 3:2 payout
            this.awardBankroll(payout);
            this.statusMessage = `BLACKJACK! YOU WIN $${payout}!`;
            return;
        }

        if (dealerScore > 21) {
            const payout = bet * 2;
            this.awardBankroll(payout);
            this.statusMessage = `DEALER BUSTED (${dealerScore})! YOU WIN $${payout}!`;
        } else if (playerScore > dealerScore) {
            const payout = bet * 2;
            this.awardBankroll(payout);
            this.statusMessage = `YOU WIN! (${playerScore} vs ${dealerScore}) - +$${payout}`;
        } else if (playerScore < dealerScore) {
            this.statusMessage = `DEALER WINS (${dealerScore} vs ${playerScore})`;
        } else {
            this.awardBankroll(bet); // Push
            this.statusMessage = `PUSH! (${playerScore} vs ${dealerScore}) - BET RETURNED`;
        }
    }

    // ==========================================
    // 3. CANVAS GRAPHICS & RENDERING
    // ==========================================
    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Felt Background
        this.ctx.fillStyle = '#1d6f42';
        this.ctx.fillRect(0, 0, w, h);

        // Felt Border Line
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(10, 10, w - 20, h - 20);

        // Header Status Banner
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.font = 'bold 15px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.statusMessage, w / 2, 35);

        // Dealer Hand
        const hideDealerCard = this.gameState === 'PLAYING';
        const dealerScoreText = hideDealerCard ? '?' : this.calculateScore(this.dealerHand);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Dealer's Hand (${dealerScoreText}):`, 40, 65);

        this.dealerHand.forEach((card, idx) => {
            const isFaceDown = idx === 1 && hideDealerCard;
            this.drawCard(card, 40 + (idx * 65), 75, isFaceDown);
        });

        // Player Hand
        const playerScore = this.playerHand.length ? this.calculateScore(this.playerHand) : 0;
        this.ctx.fillText(`Your Hand (${playerScore}):`, 40, 190);

        this.playerHand.forEach((card, idx) => {
            this.drawCard(card, 40 + (idx * 65), 200, false);
        });
    }

    drawCard(card, x, y, isFaceDown) {
        const w = 55, h = 80, radius = 5;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, radius);
        this.ctx.fillStyle = isFaceDown ? '#2c3e50' : '#ffffff';
        this.ctx.fill();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = '#bdc3c7';
        this.ctx.stroke();

        if (isFaceDown) {
            this.ctx.fillStyle = '#c0392b';
            this.ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
            this.ctx.restore();
            return;
        }

        this.ctx.fillStyle = card.color;
        this.ctx.font = 'bold 15px sans-serif';
        this.ctx.fillText(card.value, x + 6, y + 20);

        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(card.suit, x + w / 2, y + h / 2 + 10);
        this.ctx.restore();
    }

    // ==========================================
    // 4. DOM & BANKROLL INTEGRATION
    // ==========================================
    attachEventListeners() {
        const dealBtn = document.getElementById('bj-deal');
        const hitBtn = document.getElementById('bj-hit');
        const standBtn = document.getElementById('bj-stand');

        if (dealBtn) dealBtn.onclick = () => this.dealHand();
        if (hitBtn) hitBtn.onclick = () => this.hit();
        if (standBtn) standBtn.onclick = () => this.stand();
    }

    getGlobalBet() {
        const input = document.getElementById('global-bet');
        return Math.max(1, parseInt(input?.value, 10) || 10);
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

// Wrapper boot function matching index.html fallback loop
function initBlackjack() {
    window.blackjackGame = new BlackjackEngine();
    console.log("Blackjack engine initialized!");
}

window.addEventListener('load', initBlackjack);
