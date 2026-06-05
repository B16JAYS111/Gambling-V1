/**
 * TEXAS HOLD 'EM CASINO ENGINE
 * Put this entirely inside your brand new 'texas-holdem.js' file!
 */

// ==========================================
// 1. GAME STATE MANAGEMENT
// ==========================================
let holdemDeck = [];
let playerHoleCards = [];
let dealerHoleCards = [];
let communityCards = [];
let currentStreet = 'PRE_FLOP'; // PRE_FLOP, FLOP, TURN, RIVER, SHOWDOWN
let currentPot = 0;
let holdemBetAmount = 10; // Default bet size

// Connect to the canvas setup inside your HTML
const holdemCanvas = document.getElementById('holdemCanvas');
const holdemCtx = holdemCanvas.getContext('2d');

// ==========================================
// 2. CORE GAME FUNCTIONS
// ==========================================

// Create a standard 52-card deck
function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let val of values) {
            deck.push({ value: val, suit: suit, color: (suit === '♥' || suit === '♦') ? 'red' : 'black' });
        }
    }
    return deck;
}

// Shuffle implementation
function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Start a fresh hand
function startHoldemGame() {
    holdemDeck = shuffleDeck(createDeck());
    playerHoleCards = [holdemDeck.pop(), holdemDeck.pop()];
    dealerHoleCards = [holdemDeck.pop(), holdemDeck.pop()];
    communityCards = [];
    currentStreet = 'PRE_FLOP';
    currentPot = holdemBetAmount * 2; // Anti/Blinds buy-in entry
    
    // Deduct entry bet from the main bankroll element if it exists
    updateBankroll(-holdemBetAmount); 
    
    renderHoldemTable();
}

// Advance to the next card dealing phase
function advanceStreet() {
    if (currentStreet === 'PRE_FLOP') {
        // Deal the Flop (3 cards)
        communityCards.push(holdemDeck.pop(), holdemDeck.pop(), holdemDeck.pop());
        currentStreet = 'FLOP';
    } else if (currentStreet === 'FLOP') {
        // Deal the Turn (1 card)
        communityCards.push(holdemDeck.pop());
        currentStreet = 'TURN';
    } else if (currentStreet === 'TURN') {
        // Deal the River (1 card)
        communityCards.push(holdemDeck.pop());
        currentStreet = 'RIVER';
    } else if (currentStreet === 'RIVER') {
        currentStreet = 'SHOWDOWN';
        evaluateWinner();
    }
    renderHoldemTable();
}

function foldHand() {
    alert("You folded! Dealer takes the pot.");
    startHoldemGame(); // Restart
}

function evaluateWinner() {
    // Basic placeholder evaluation logic until you implement a 7-card evaluator
    // For now, randomly decides a winner for framework testing
    const playerWon = Math.random() > 0.5;
    if (playerWon) {
        alert(`Showdown! You won the $${currentPot} pot!`);
        updateBankroll(currentPot);
    } else {
        alert("Showdown! Dealer wins this hand.");
    }
    startHoldemGame();
}

function updateBankroll(amount) {
    const balanceEl = document.getElementById('player-balance');
    if (balanceEl) {
        let currentBalance = parseInt(balanceEl.innerText);
        balanceEl.innerText = currentBalance + amount;
    }
}

// ==========================================
// 3. GRAPHICS & CANVAS RENDERING
// ==========================================
function drawCard(ctx, card, x, y, isFaceDown = false) {
    const width = 60;
    const height = 90;
    
    // Draw Card Background Box
    ctx.fillStyle = isFaceDown ? '#2c3e50' : 'white';
    ctx.strokeStyle = '#d35400';
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, width, height);
    ctx.strokeRect(x, y, width, height);
    
    if (isFaceDown) {
        // Card back pattern
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x + 5, y + 5, width - 10, height - 10);
        return;
    }
    
    // Draw Value and Suit Text
    ctx.fillStyle = card.color;
    ctx.font = 'bold 20px Arial';
    ctx.fillText(card.value, x + 8, y + 25);
    ctx.font = '28px Arial';
    ctx.fillText(card.suit, x + 16, y + 60);
}

function renderHoldemTable() {
    // Clear canvas frame
    holdemCtx.clearRect(0, 0, holdemCanvas.width, holdemCanvas.height);
    
    // Draw Game Information text
    holdemCtx.fillStyle = 'white';
    holdemCtx.font = '16px Arial';
    holdemCtx.fillText(`Current Phase: ${currentStreet}`, 20, 30);
    holdemCtx.fillText(`Total Pot: $${currentPot}`, 20, 55);
    
    // 1. Draw Dealer Hand (Hidden until Showdown phase)
    holdemCtx.fillText("Dealer's Hand:", 450, 30);
    const hideDealer = currentStreet !== 'SHOWDOWN';
    dealerHoleCards.forEach((card, index) => {
        drawCard(holdemCtx, card, 450 + (index * 70), 45, hideDealer);
    });
    
    // 2. Draw 5 Community Cards (Flop, Turn, River)
    holdemCtx.fillText("Community Cards:", 50, 140);
    for (let i = 0; i < 5; i++) {
        if (communityCards[i]) {
            drawCard(holdemCtx, communityCards[i], 50 + (i * 75), 160);
        } else {
            // Draw an empty placeholder card slot boundary
            holdemCtx.strokeStyle = 'rgba(255,255,255,0.2)';
            holdemCtx.strokeRect(50 + (i * 75), 160, 60, 90);
        }
    }
    
    // 3. Draw Player Hole Cards
    holdemCtx.fillText("Your Hole Cards:", 450, 240);
    playerHoleCards.forEach((card, index) => {
        drawCard(holdemCtx, card, 450 + (index * 70), 255);
    });
}

// ==========================================
// 4. ATTACH TO YOUR HTML BUTTON CONTROLS
// ==========================================
// Hook up the buttons inside your HTML to call these actions dynamically
window.addEventListener('load', () => {
    // Set up default buttons if they are clicked
    const controls = document.getElementById('holdem-controls');
    if (controls) {
        const buttons = controls.getElementsByTagName('button');
        
        // Button 0: Check (Advances the game board cards forward)
        buttons[0].onclick = () => { advanceStreet(); };
        
        // Button 1: Bet / Raise (Adds money to pot and advances game board)
        buttons[1].onclick = () => { 
            currentPot += holdemBetAmount;
            updateBankroll(-holdemBetAmount);
            advanceStreet(); 
        };
        
        // Button 2: Fold (Forfeits current hand)
        buttons[2].onclick = () => { foldHand(); };
    }
    
    // Boot up the first game dealing instantly
    startHoldemGame();
});
