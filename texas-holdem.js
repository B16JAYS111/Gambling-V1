/**
 * TEXAS HOLD 'EM CASINO ENGINE (Upgraded)
 * File: texas-holdem.js
 */

// ==========================================
// 1. POKER HAND EVALUATOR (7-CARD COMBINATORICS)
// ==========================================
class PokerEvaluator {
    static CARD_VALUES = {'2':2, '3':3, '4':4, '5':5, '6':6, '7':7, '8':8, '9':9, '10':10, 'J':11, 'Q':12, 'K':13, 'A':14};

    static evaluate7Cards(cards) {
        const combinations = this.getCombinations(cards, 5);
        let bestScore = -1;
        let bestHandName = '';

        for (const combo of combinations) {
            const { score, name } = this.evaluate5Cards(combo);
            if (score > bestScore) {
                bestScore = score;
                bestHandName = name;
            }
        }
        return { score: bestScore, handName: bestHandName };
    }

    static getCombinations(set, k) {
        if (k > set.length || k <= 0) return [];
        if (k === set.length) return [set];
        if (k === 1) return set.map(c => [c]);
        
        const combos = [];
        for (let i = 0; i < set.length - k + 1; i++) {
            const head = set.slice(i, i + 1);
            const tailCombos = this.getCombinations(set.slice(i + 1), k - 1);
            for (const tail of tailCombos) combos.push(head.concat(tail));
        }
        return combos;
    }

    static evaluate5Cards(cards) {
        const values = cards.map(c => this.CARD_VALUES[c.value]).sort((a, b) => b - a);
        const suits = cards.map(c => c.suit);
        const isFlush = suits.every(s => s === suits[0]);

        let isStraight = false;
        let straightHigh = 0;

        if (new Set(values).size === 5) {
            if (values[0] - values[4] === 4) {
                isStraight = true;
                straightHigh = values[0];
            } else if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
                isStraight = true;
                straightHigh = 5;
            }
        }

        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const grouped = Object.entries(counts)
            .map(([val, count]) => ({ val: parseInt(val), count }))
            .sort((a, b) => b.count - a.count || b.val - a.val);

        if (isFlush && isStraight) {
            return { score: 900000000 + straightHigh, name: straightHigh === 14 ? 'Royal Flush' : 'Straight Flush' };
        }
        if (grouped[0].count === 4) {
            return { score: 800000000 + grouped[0].val * 100 + grouped[1].val, name: 'Four of a Kind' };
        }
        if (grouped[0].count === 3 && grouped[1].count === 2) {
            return { score: 700000000 + grouped[0].val * 100 + grouped[1].val, name: 'Full House' };
        }
        if (isFlush) {
            const tiebreaker = values.reduce((acc, v, i) => acc + v * Math.pow(15, 4 - i), 0);
            return { score: 600000000 + tiebreaker, name: 'Flush' };
        }
        if (isStraight) {
            return { score: 500000000 + straightHigh, name: 'Straight' };
        }
        if (grouped[0].count === 3) {
            return { score: 400000000 + grouped[0].val * 1000 + grouped[1].val * 15 + grouped[2].val, name: 'Three of a Kind' };
        }
        if (grouped[0].count === 2 && grouped[1].count === 2) {
            return { score: 300000000 + grouped[0].val * 1000 + grouped[1].val * 15 + grouped[2].val, name: 'Two Pair' };
        }
        if (grouped[0].count === 2) {
            const kickerTiebreaker = grouped.slice(1).reduce((acc, p, i) => acc + p.val * Math.pow(15, 2 - i), 0);
            return { score: 200000000 + grouped[0].val * 10000 + kickerTiebreaker, name: 'One Pair' };
        }
        const tiebreaker = values.reduce((acc, v, i) => acc + v * Math.pow(15, 4 - i), 0);
        return { score: 100000000 + tiebreaker, name: 'High Card' };
    }
}

// ==========================================
// 2. MAIN POKER ENGINE CLASS
// ==========================================
class HoldemEngine {
    constructor() {
        this.canvas = document.getElementById('holdemCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.deck = [];
        this.playerHole = [];
        this.dealerHole = [];
        this.communityCards = [];
        
        this.street = 'PRE_FLOP'; // PRE_FLOP, FLOP, TURN, RIVER, SHOWDOWN
        this.pot = 0;
        this.currentBet = 0;
        this.playerBetThisStreet = 0;
        this.betSize = 10;
        this.gameStatus = "Your Action";

        this.initControls();
        this.startHand();
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck = [];
        for (let suit of suits) {
            for (let val of values) {
                deck.push({ value: val, suit: suit, color: (suit === '♥' || suit === '♦') ? '#e74c3c' : '#2c3e50' });
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

    startHand() {
        this.deck = this.shuffle(this.createDeck());
        this.playerHole = [this.deck.pop(), this.deck.pop()];
        this.dealerHole = [this.deck.pop(), this.deck.pop()];
        this.communityCards = [];
        
        this.street = 'PRE_FLOP';
        this.pot = 0;
        this.currentBet = this.betSize;
        this.playerBetThisStreet = 0;
        this.gameStatus = "Place your bet or check.";

        // Post blinds ($10 player, $10 dealer)
        this.deductBankroll(this.betSize);
        this.pot += this.betSize * 2;

        this.updateButtonLabels();
        this.render();
    }

    advanceStreet() {
        this.playerBetThisStreet = 0;
        this.currentBet = 0;

        if (this.street === 'PRE_FLOP') {
            this.communityCards.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
            this.street = 'FLOP';
        } else if (this.street === 'FLOP') {
            this.communityCards.push(this.deck.pop());
            this.street = 'TURN';
        } else if (this.street === 'TURN') {
            this.communityCards.push(this.deck.pop());
            this.street = 'RIVER';
        } else if (this.street === 'RIVER') {
            this.street = 'SHOWDOWN';
            this.evaluateShowdown();
            return;
        }

        this.gameStatus = `Street: ${this.street}. Your action.`;
        this.updateButtonLabels();
        this.render();
    }

    playerCheckCall() {
        const callAmount = this.currentBet - this.playerBetThisStreet;
        if (callAmount > 0) {
            this.deductBankroll(callAmount);
            this.pot += callAmount;
            this.playerBetThisStreet += callAmount;
        }
        this.dealerAction();
    }

    playerRaise() {
        const raiseAmount = this.betSize;
        this.deductBankroll(raiseAmount);
        this.pot += raiseAmount;
        this.currentBet += raiseAmount;
        this.playerBetThisStreet += raiseAmount;
        
        this.gameStatus = `You raised $${raiseAmount}.`;
        this.dealerAction();
    }

    playerFold() {
        this.gameStatus = "You folded. Dealer wins the pot.";
        this.render();
        setTimeout(() => this.startHand(), 2000);
    }

    dealerAction() {
        if (this.street === 'SHOWDOWN') return;

        // Simple Dealer AI based on hand quality
        const dealerAllCards = [...this.dealerHole, ...this.communityCards];
        const evaluation = PokerEvaluator.evaluate7Cards(dealerAllCards);

        // Dealer calls or advances
        if (evaluation.score > 200000000 || Math.random() > 0.4) {
            this.advanceStreet();
        } else {
            this.gameStatus = "Dealer folded! You win the pot!";
            this.awardBankroll(this.pot);
            this.render();
            setTimeout(() => this.startHand(), 2500);
        }
    }

    evaluateShowdown() {
        const playerEval = PokerEvaluator.evaluate7Cards([...this.playerHole, ...this.communityCards]);
        const dealerEval = PokerEvaluator.evaluate7Cards([...this.dealerHole, ...this.communityCards]);

        if (playerEval.score > dealerEval.score) {
            this.gameStatus = `YOU WIN $${this.pot}! (${playerEval.handName})`;
            this.awardBankroll(this.pot);
        } else if (dealerEval.score > playerEval.score) {
            this.gameStatus = `DEALER WINS with ${dealerEval.handName}.`;
        } else {
            this.gameStatus = `SPLIT POT! Both had ${playerEval.handName}.`;
            this.awardBankroll(this.pot / 2);
        }

        this.render();
        setTimeout(() => this.startHand(), 4000);
    }

    deductBankroll(amt) {
        const el = document.getElementById('player-balance');
        if (el) el.innerText = Math.max(0, parseInt(el.innerText) - amt);
    }

    awardBankroll(amt) {
        const el = document.getElementById('player-balance');
        if (el) el.innerText = parseInt(el.innerText) + amt;
    }

    updateButtonLabels() {
        const controls = document.getElementById('holdem-controls');
        if (!controls) return;
        const btns = controls.getElementsByTagName('button');
        
        const callAmt = this.currentBet - this.playerBetThisStreet;
        if (btns[0]) btns[0].innerText = callAmt > 0 ? `Call $${callAmt}` : "Check";
        if (btns[1]) btns[1].innerText = `Raise +$${this.betSize}`;
        if (btns[2]) btns[2].innerText = "Fold";
    }

    // ==========================================
    // 3. GRAPHICS & CANVAS RENDERING
    // ==========================================
    drawCard(card, x, y, isFaceDown = false) {
        const w = 65, h = 95, radius = 6;

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 6;
        this.ctx.shadowOffsetY = 3;

        // Card Base Body
        this.ctx.beginPath();
        this.ctx.roundRect(x, y, w, h, radius);
        this.ctx.fillStyle = isFaceDown ? '#1e3799' : '#ffffff';
        this.ctx.fill();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = '#dcdde1';
        this.ctx.stroke();
        this.ctx.restore();

        if (isFaceDown) {
            // Card Back Pattern
            this.ctx.fillStyle = '#0c2461';
            this.ctx.beginPath();
            this.ctx.roundRect(x + 5, y + 5, w - 10, h - 10, 4);
            this.ctx.fill();
            return;
        }

        // Draw Card Suits & Values
        this.ctx.fillStyle = card.color;
        this.ctx.font = 'bold 18px sans-serif';
        this.ctx.fillText(card.value, x + 8, y + 22);
        this.ctx.font = '26px sans-serif';
        this.ctx.fillText(card.suit, x + 18, y + 62);
    }

    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Draw Casino Felt Background
        const radial = this.ctx.createRadialGradient(width/2, height/2, 50, width/2, height/2, width/2);
        radial.addColorStop(0, '#27ae60');
        radial.addColorStop(1, '#1e824c');
        this.ctx.fillStyle = radial;
        this.ctx.fillRect(0, 0, width, height);

        // Header Game Info Banner
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.fillText(`Pot: $${this.pot}`, 20, 30);
        this.ctx.fillText(`Status: ${this.gameStatus}`, 20, 55);

        // Dealer Cards
        this.ctx.fillText("Dealer Hand:", 450, 30);
        const hideDealer = this.street !== 'SHOWDOWN';
        this.dealerHole.forEach((card, i) => {
            this.drawCard(card, 450 + (i * 72), 40, hideDealer);
        });

        // Community Cards
        this.ctx.fillText("Community Cards:", 30, 140);
        for (let i = 0; i < 5; i++) {
            if (this.communityCards[i]) {
                this.drawCard(this.communityCards[i], 30 + (i * 75), 160);
            } else {
                this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(30 + (i * 75), 160, 65, 95);
            }
        }

        // Player Hole Cards
        this.ctx.fillText("Your Hole Cards:", 450, 230);
        this.playerHole.forEach((card, i) => {
            this.drawCard(card, 450 + (i * 72), 245);
        });
    }

    initControls() {
        const controls = document.getElementById('holdem-controls');
        if (controls) {
            const btns = controls.getElementsByTagName('button');
            if (btns[0]) btns[0].onclick = () => this.playerCheckCall();
            if (btns[1]) btns[1].onclick = () => this.playerRaise();
            if (btns[2]) btns[2].onclick = () => this.playerFold();
        }
    }
}

// Instantiate engine when DOM is ready
window.addEventListener('load', () => {
    window.holdemGame = new HoldemEngine();
});
