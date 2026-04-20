/**
 * Main - Application initialization and event coordination
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize managers
  const audioManager = new AudioManager();
  const uiManager = new UIManager(null, null); // Will update references below
  const gameEngine = new GameEngine(audioManager, uiManager);
  
  // Update UIManager references (circular dependency resolution)
  uiManager.gameEngine = gameEngine;
  uiManager.audioManager = audioManager;

  // ==========================================
  // HOME SCREEN EVENT LISTENERS
  // ==========================================
  
  // Play button
  document.getElementById('play-btn').addEventListener('click', () => {
    // Initialize audio context on user interaction
    audioManager.initAudioContext();
    
    // Start game
    gameEngine.startGame();
    
    // Switch to game screen
    uiManager.showScreen('game-screen');
    
    // Render game elements
    uiManager.renderContainers();
    uiManager.renderIngredients();
    
    // Initialize drag and drop
    gameEngine.initDragAndDrop();
  });

  // Instructions button
  document.getElementById('instructions-btn').addEventListener('click', () => {
    uiManager.showInstructionsModal();
  });

  // ==========================================
  // GAME SCREEN EVENT LISTENERS
  // ==========================================
  
  // Hint button
  document.getElementById('hint-btn').addEventListener('click', () => {
    gameEngine.useHint();
  });

  // Check Answers button
  document.getElementById('check-answers-btn').addEventListener('click', () => {
    gameEngine.checkAnswers();
  });

  // ==========================================
  // RESULT SCREEN EVENT LISTENERS
  // ==========================================
  
  // Play again button
  document.getElementById('play-again-btn').addEventListener('click', () => {
    // Start new game
    gameEngine.startGame();
    
    // Switch to game screen
    uiManager.showScreen('game-screen');
    
    // Render game elements
    uiManager.renderContainers();
    uiManager.renderIngredients();
    
    // Initialize drag and drop
    gameEngine.initDragAndDrop();
  });
  
  // Home button
  document.getElementById('home-btn').addEventListener('click', () => {
    // Switch to home screen
    uiManager.showScreen('home-screen');
  });

  // Re-initialize drag and drop when ingredients are added/removed
  // NOT NEEDED - event delegation handles dynamic elements automatically
  // The dragstart/dragend listeners are on document and use closest() to find elements

  // ==========================================
  // MODAL EVENT LISTENERS
  // ==========================================
  
  // Close modal (X button)
  document.getElementById('close-modal').addEventListener('click', () => {
    uiManager.hideInstructionsModal();
  });
  
  // Close modal (Got it button)
  document.getElementById('close-modal-btn').addEventListener('click', () => {
    uiManager.hideInstructionsModal();
  });
  
  // Close modal when clicking outside
  document.getElementById('instructions-modal').addEventListener('click', (e) => {
    if (e.target.id === 'instructions-modal') {
      uiManager.hideInstructionsModal();
    }
  });

  // ==========================================
  // KEYBOARD SUPPORT
  // ==========================================
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      uiManager.hideInstructionsModal();
    }
  });

  console.log('NAN Smart Mix initialized successfully!');
});
