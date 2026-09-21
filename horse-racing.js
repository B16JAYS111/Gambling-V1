/**
 * HORSE RACING CASINO ENGINE
 * File: horse-racing.js
 */

class HorseRacingEngine {
    constructor() {
        this.canvas = document.getElementById('horseCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        // Track & Race Configuration
        this.finishLineX = this.canvas.width - 70;
        this.startX = 60;
        this.state = 'BETTING'; // 'BETTING', 'RACING', 'FINISHED'
        this.animationId = null;
        this.finishOrder = [];

        // Horse Roster (Odds, Colors, Names)
        this.horses = [
            { id: 1, name: "Thunder Bolt", odds: 2.5, color: '#e74c3c', x: this.startX, lane: 0, speed: 0, bounce: 0 },
            { id: 2, name: "Midnight Star", odds: 4.0, color: '#9b59b6', x: this.startX, lane: 1, speed: 0, bounce: 0 },
            { id: 3, name: "Golden Arrow", odds: 5.5, color: '#f1c40f', x: this.startX, lane: 2, speed: 0, bounce: 0 },
            { id: 4, name: "Lucky Streak", odds: 8.0, color: '#2ecc71', x: this.startX, lane: 3, speed: 0, bounce: 0 },
            { id: 5, name: "Shadow Runner", odds: 12.0, color: '#e67e22', x: this.startX, lane: 4, speed: 0, bounce: 0 }
        ];

        this.selectedHorseId = 1;
        this.betAmount = 10;
        this.statusMessage = "Select your horse and place a bet!";

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.render();
    }

    // ==========================================
    // 1. GAME CONTROL & RACE LOOP
    // ==========================================
    startRace() {
        if (this.state === 'RACING') return;

        // Verify & Deduct Bankroll
        if (!this.deductBankroll(this.betAmount)) {
            this.updateStatus("INSUFFICIENT FUNDS TO PLACE BET!", "error");
            return;
        }

        // Reset Race State
        this.finishOrder = [];
        this.horses.forEach(h => {
            h.x = this.startX;
            h.speed = 0;
            h.bounce = 0;
        });

        this.state = 'RACING';
        this.updateStatus("THE RACE IS UNDERWAY!", "info");
        this.toggleControls(true);

        // Start Animation Loop
        this.raceLoop();
    }

    raceLoop() {
        if (this.state !== 'RACING') return;

        this.updatePhysics();
        this.render();

        // Check if all horses finished
        if (this.finishOrder.length < this.horses.length) {
            this.animationId = requestAnimationFrame(() => this.raceLoop());
        } else {
            this.evaluateRaceOutcome();
        }
    }

    updatePhysics() {
        this.horses.forEach(horse => {
            // Skip if already past finish line
            if (horse.x >= this.finishLineX) return;

            // Stochastic Movement: Base speed + random burst + rubber-banding momentum
            const baseSpeed = 1.2 + (1 / horse.odds) * 0.8;
            const randomSurge = Math.random() < 0.15 ? Math.random() * 2.5 : Math.random() * 0.8;
            horse.speed = baseSpeed + randomSurge;
            horse.x += horse.speed;

            // Gallop bounce animation parameter
            horse.bounce = (horse.bounce + 0.3) % (Math.PI * 2);

            // Cross Finish Line
            if (horse.x >= this.finishLineX) {
                horse.x = this.finishLineX;
                this.finishOrder.push(horse);
            }
        });
    }

    evaluateRaceOutcome() {
        this.state = 'FINISHED';
        this.toggleControls(false);

        const winner = this.finishOrder[0];
        const isUserWinner = winner.id === this.selectedHorseId;

        if (isUserWinner) {
            const payout = Math.round(this.betAmount * winner.odds);
            this.awardBankroll(payout);
            this.updateStatus(`WINNER! #${winner.id} ${winner.name} WON! YOU WON $${payout}!`, "win");
        } else {
            this.updateStatus(`RACE OVER! #${winner.id} ${winner.name} WON. TRY AGAIN!`, "loss");
        }

        this.render();
    }

    // ==========================================
    // 2. CANVAS GRAPHICS & TRACK RENDER
    // ==========================================
    render() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Grass Border
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(0, 0, w, h);

        // Dirt Track
        const trackY = 40;
        const trackH = h - 80;
        this.ctx.fillStyle = '#d35400';
        this.ctx.fillRect(0, trackY, w, trackH);

        // Lane Lines
        const numLanes = this.horses.length;
        const laneH = trackH / numLanes;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 2;

        for (let i = 0; i <= numLanes; i++) {
            const y = trackY + (i * laneH);
            this.ctx.beginPath();
            this.ctx.setLineDash([10, 10]);
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]); // Reset line dash

        // Start Line
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, trackY);
        this.ctx.lineTo(this.startX, trackY + trackH);
        this.ctx.stroke();

        // Finish Line (Checkerboard Pattern)
        this.drawFinishLine(this.finishLineX, trackY, trackH);

        // Render Horses
        this.horses.forEach((horse, idx) => {
            const laneCenterY = trackY + (idx * laneH) + (laneH / 2);
            this.drawHorse(horse, horse.x, laneCenterY);
        });

        // Overlay Status Message
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 15px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(this.statusMessage, 20, 25);
    }

    drawFinishLine(x, y, height) {
        const squareSize = 10;
        const rows = height / squareSize;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < 2; c++) {
                this.ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000';
                this.ctx.fillRect(x + (c * squareSize), y + (r * squareSize), squareSize, squareSize);
            }
        }
    }

    drawHorse(horse, x, y) {
        const bounceY = Math.sin(horse.bounce) * 4;

        this.ctx.save();
        this.ctx.translate(x, y + bounceY);

        // Selection Highlight Ring
        if (horse.id === this.selectedHorseId) {
            this.ctx.strokeStyle = '#f1c40f';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Horse Body (Circle representation with number tag)
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 14, 0, Math.PI * 2);
        this.ctx.fillStyle = horse.color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Number Tag
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(horse.id, 0, 0);

        // Horse Name & Odds Label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '11px sans-serif';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${horse.name} (${horse.odds}x)`, -20, 4);

        this.ctx.restore();
    }

    // ==========================================
    // 3. UI & DOM HANDLERS
    // ==========================================
    attachEventListeners() {
        const startBtn = document.getElementById('start-race-btn');
        if (startBtn) {
            startBtn.onclick = () => this.startRace();
        }

        const horseSelect = document.getElementById('horse-select');
        if (horseSelect) {
            horseSelect.onchange = (e) => {
                this.selectedHorseId = parseInt(e.target.value, 10);
                this.render();
            };
        }

        const betInput = document.getElementById('bet-amount');
        if (betInput) {
            betInput.onchange = (e) => {
                this.betAmount = Math.max(1, parseInt(e.target.value, 10) || 10);
            };
        }
    }

    toggleControls(disabled) {
        const startBtn = document.getElementById('start-race-btn');
        const horseSelect = document.getElementById('horse-select');
        const betInput = document.getElementById('bet-amount');

        if (startBtn) startBtn.disabled = disabled;
        if (horseSelect) horseSelect.disabled = disabled;
        if (betInput) betInput.disabled = disabled;
    }

    updateStatus(msg) {
        this.statusMessage = msg;
        const statusEl = document.getElementById('race-status-message');
        if (statusEl) statusEl.innerText = msg;
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

// Global initialization function matching your setup
function initHorseRacing() {
    window.horseEngine = new HorseRacingEngine();
    console.log("Horse Racing canvas initialized!");
}

window.addEventListener('load', () => {
    initHorseRacing();
});
