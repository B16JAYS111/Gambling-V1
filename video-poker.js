// Make sure this matches the HTML ID exactly!
const canvas = document.getElementById('pokerCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Wrap your game boot-up code in this function so the menu can trigger it
function initVideoPoker() {
    if (!canvas) return;
    
    // Put your game's starting function here! 
    // For example, if your original start function was called startPoker():
    // startPoker(); 
    
    console.log("Video Poker canvas initialized!");
}

// Call it on page load just in case
window.addEventListener('load', initVideoPoker);
