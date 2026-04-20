/**
 * Game Engine - Core game logic and drag-and-drop system
 */

class GameEngine {
  constructor(audioManager, uiManager) {
    this.audioManager = audioManager;
    this.uiManager = uiManager;
    
    // Game state
    this.hintsRemaining = GameConfig.hints.max;
    this.containerContents = {};
    this.gameActive = false;
    this.currentHintIngredient = null;
    
    // Drag-and-drop initialization flag (prevent duplicate listeners)
    this.dragAndDropInitialized = false;
    
    // Touch drag state
    this.touchDragElement = null;
    this.touchDragData = null;
    this.touchDragSource = null; // 'ingredients' or 'container'
    this.touchOffsetX = 0;
    this.touchOffsetY = 0;
  }

  /**
   * Start a new game
   */
  startGame() {
    // Reset game state
    this.hintsRemaining = GameConfig.hints.max;
    this.gameActive = true;
    this.currentHintIngredient = null;
    this.dragAndDropInitialized = false; // Reset for new game
    
    // Reset ingredient ID counter
    GameConfig.resetIngredientIdCounter();
    
    // Initialize container contents
    this.containerContents = {};
    Object.keys(GameConfig.containers).forEach(containerId => {
      this.containerContents[containerId] = [];
    });
    
    // Update UI
    this.uiManager.updateHintsDisplay(this.hintsRemaining);
    
    // Enable hint button
    const hintButton = document.getElementById('hint-btn');
    hintButton.disabled = false;
    
    // Disable check answers button initially (no ingredients in containers)
    this.updateCheckButtonState();
    
    console.log('Game started!');
  }

  /**
   * Process a drop event into a container (desktop or mobile)
   * @param {string} containerId - Target container ID
   * @param {string} ingredientId - Unique ingredient ID (e.g., "Milk_1")
   * @param {string} ingredientName - Ingredient name (e.g., "Milk")
   * @param {HTMLElement} ingredientElement - The ingredient DOM element
   * @param {string} source - Source of drag: 'ingredients' or container ID
   */
  processDrop(containerId, ingredientId, ingredientName, ingredientElement, source = 'ingredients') {
    if (!this.gameActive) return;
    
    // If dragging from another container, remove it first
    if (source !== 'ingredients' && source !== containerId) {
      this.removeIngredientFromContainer(source, ingredientId, ingredientName, false);
    }
    
    // Check if this specific ingredient instance already in this container
    if (this.containerContents[containerId].includes(ingredientId)) {
      console.log('Ingredient already in this container');
      return;
    }
    
    // Add ingredient to container
    this.containerContents[containerId].push(ingredientId);
    
    // ALWAYS update fill level based on total ingredients placed (correct or incorrect)
    const totalPlaced = this.containerContents[containerId].length;
    const totalRequired = GameConfig.containers[containerId].ingredients.length;
    
    // Update fill level visually (capped at 100%)
    this.uiManager.updateFillLevel(
      containerId,
      totalPlaced,
      totalRequired
    );
    
    // Play success sound
    this.audioManager.playSuccess();
    
    // Update UI
    this.uiManager.addIngredientToContainer(containerId, ingredientId, ingredientName, ingredientElement);
    this.uiManager.updateProgress(
      containerId,
      totalPlaced,
      totalRequired
    );
    
    // Remove ingredient from source if it was from ingredients area
    if (source === 'ingredients' && ingredientElement) {
      ingredientElement.remove();
    }
    
    // Clear hint if this was the hinted ingredient
    if (this.currentHintIngredient === ingredientName) {
      this.currentHintIngredient = null;
    }
    
    console.log(`${ingredientName} (${ingredientId}) added to Container ${containerId} (${totalPlaced}/${totalRequired})`);
    
    // Update check button state
    this.updateCheckButtonState();
  }

  /**
   * Get the correct container for an ingredient
   * @param {string} ingredientName - Ingredient name
   * @returns {string} Container ID
   */
  getCorrectContainer(ingredientName) {
    for (const containerId of Object.keys(GameConfig.containers)) {
      const container = GameConfig.containers[containerId];
      if (container.ingredients.includes(ingredientName)) {
        return containerId;
      }
    }
    return null;
  }

  /**
   * Check if an ingredient belongs to a specific container
   * @param {string} ingredientName - Ingredient name
   * @param {string} containerId - Container ID to check
   * @returns {boolean} True if ingredient belongs to container
   */
  isIngredientCorrectForContainer(ingredientName, containerId) {
    const container = GameConfig.containers[containerId];
    return container && container.ingredients.includes(ingredientName);
  }

  /**
   * Remove an ingredient from a container
   * @param {string} containerId - Container ID
   * @param {string} ingredientId - Unique ingredient ID
   * @param {string} ingredientName - Ingredient name
   * @param {boolean} readdToIngredients - Whether to re-add to ingredients area (default: true)
   */
  removeIngredientFromContainer(containerId, ingredientId, ingredientName, readdToIngredients = true) {
    // Remove from container contents
    const index = this.containerContents[containerId].indexOf(ingredientId);
    if (index > -1) {
      this.containerContents[containerId].splice(index, 1);
    }
    
    // ALWAYS update fill level based on remaining total ingredients
    const totalPlaced = this.containerContents[containerId].length;
    const totalRequired = GameConfig.containers[containerId].ingredients.length;
    
    this.uiManager.updateFillLevel(
      containerId,
      totalPlaced,
      totalRequired
    );
    
    // Remove from container UI
    this.uiManager.removeIngredientFromContainer(containerId, ingredientId);
    
    // Update progress
    this.uiManager.updateProgress(
      containerId,
      totalPlaced,
      totalRequired
    );
    
    // Re-add to ingredients area if requested
    if (readdToIngredients) {
      this.uiManager.addIngredientBackToArea(ingredientId, ingredientName);
    }
    
    console.log(`${ingredientName} (${ingredientId}) removed from Container ${containerId} (${totalPlaced}/${totalRequired} remaining)`);
    
    // Update check button state
    this.updateCheckButtonState();
  }

  /**
   * Check if all containers have at least one ingredient and update button state
   */
  updateCheckButtonState() {
    const allContainersHaveIngredients = Object.keys(GameConfig.containers).every(containerId => {
      return this.containerContents[containerId] && this.containerContents[containerId].length > 0;
    });
    
    const checkButton = document.getElementById('check-answers-btn');
    if (checkButton) {
      checkButton.disabled = !allContainersHaveIngredients;
    }
    
    console.log('Check button state:', allContainersHaveIngredients ? 'enabled' : 'disabled');
  }

  /**
   * Check if all containers have the correct ingredients
   */
  checkAnswers() {
    if (!this.gameActive) return;
    
    let allCorrect = true;
    let details = [];
    
    // Check each container
    for (const containerId of Object.keys(GameConfig.containers)) {
      const required = GameConfig.containers[containerId].ingredients;
      const actualIds = this.containerContents[containerId];
      
      // Convert unique IDs back to base ingredient names for comparison
      const actual = actualIds.map(id => {
        // Extract base name from ID (e.g., "Milk_1" -> "Milk")
        const lastUnderscoreIndex = id.lastIndexOf('_');
        return lastUnderscoreIndex > -1 ? id.substring(0, lastUnderscoreIndex) : id;
      });
      
      // Check if counts match
      if (actual.length !== required.length) {
        allCorrect = false;
        details.push(`${GameConfig.containers[containerId].name}: ${actual.length}/${required.length} ingredients`);
        continue;
      }
      
      // Check if all required ingredients are present
      const missing = required.filter(ing => !actual.includes(ing));
      const extra = actual.filter(ing => !required.includes(ing));
      
      if (missing.length > 0 || extra.length > 0) {
        allCorrect = false;
        let msg = `${GameConfig.containers[containerId].name}: `;
        if (missing.length > 0) msg += `Missing ${missing.join(', ')}`;
        if (extra.length > 0) msg += `${missing.length > 0 ? '; ' : ''}Has extra ${extra.join(', ')}`;
        details.push(msg);
      }
    }
    
    // Show result
    const result = {
      isCorrect: allCorrect,
      details: allCorrect ? 'All ingredients are in the right containers!' : details.join('\n')
    };
    
    this.gameActive = false;
    this.uiManager.showResult(result);
    
    // Show result screen and then play audio after it appears
    setTimeout(() => {
      this.uiManager.showScreen('result-screen');
      
      // Play audio after screen is visible (additional 200ms delay for smooth transition)
      setTimeout(() => {
        if (allCorrect) {
          this.audioManager.playCompletion();
        } else {
          this.audioManager.playError();
        }
      }, 200);
    }, 800);
    
    console.log('Check answers result:', result);
  }

  /**
   * Get list of ingredients that haven't been placed yet
   * @returns {Array} Array of {id, name, container} objects
   */
  getRemainingIngredients() {
    const remaining = [];
    
    Object.keys(GameConfig.containers).forEach(containerId => {
      const container = GameConfig.containers[containerId];
      
      // Get ingredients not yet placed
      container.ingredients.forEach(ingredientName => {
        // Check if this ingredient is still in the draggable area
        const ingredientElement = document.querySelector(`#ingredients-area [data-ingredient="${ingredientName}"]`);
        if (ingredientElement) {
          remaining.push({
            id: ingredientElement.dataset.ingredientId,
            name: ingredientName,
            container: containerId
          });
        }
      });
    });
    
    return remaining;
  }

  /**
   * Use a hint to show correct container for a random ingredient
   */
  useHint() {
    if (!this.gameActive || this.hintsRemaining <= 0) return;
    
    // Find an ingredient that hasn't been placed yet
    const remainingIngredients = this.getRemainingIngredients();
    
    if (remainingIngredients.length === 0) return;
    
    // Decrement hints
    this.hintsRemaining--;
    
    // Play hint sound
    this.audioManager.playHint();
    
    // Update UI
    this.uiManager.updateHintsDisplay(this.hintsRemaining);
    
    // Highlight correct container for a random remaining ingredient
    const randomIngredient = remainingIngredients[Math.floor(Math.random() * remainingIngredients.length)];
    const correctContainer = this.getCorrectContainer(randomIngredient.name);
    
    this.currentHintIngredient = randomIngredient.name;
    this.uiManager.showHintHighlight(correctContainer);
    
    console.log(`Hint: ${randomIngredient.name} goes to Container ${correctContainer}`);
  }

  /**
   * Set up drag and drop event listeners for desktop
   * Uses event delegation - listeners attached to parent containers only ONCE
   */
  setupDesktopDragAndDrop() {
    // Set up drop zones (containers)
    document.querySelectorAll('.container').forEach(container => {
      // Drag over - allow dropping
      container.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        container.classList.add('drag-over');
      });
      
      // Drag leave
      container.addEventListener('dragleave', () => {
        container.classList.remove('drag-over');
      });
      
      // Drop
      container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.classList.remove('drag-over');
        
        const ingredientId = e.dataTransfer.getData('ingredient-id');
        const ingredientName = e.dataTransfer.getData('text/plain');
        const source = e.dataTransfer.getData('source');
        const ingredientElement = document.querySelector(`[data-ingredient-id="${ingredientId}"]`);
        const containerId = container.dataset.containerId;
        
        this.processDrop(containerId, ingredientId, ingredientName, ingredientElement, source);
      });
    });
    
    // Set up ingredients area as drop zone (for removal)
    const ingredientsAreaWrapper = document.querySelector('.ingredients-area');
    const ingredientsGrid = document.getElementById('ingredients-area');
    
    if (ingredientsAreaWrapper) {
      ingredientsAreaWrapper.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        ingredientsAreaWrapper.classList.add('drag-over');
      });
      
      ingredientsAreaWrapper.addEventListener('dragleave', (e) => {
        // Only remove highlight if actually leaving the wrapper
        if (!ingredientsAreaWrapper.contains(e.relatedTarget)) {
          ingredientsAreaWrapper.classList.remove('drag-over');
        }
      });
      
      ingredientsAreaWrapper.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ingredientsAreaWrapper.classList.remove('drag-over');
        
        const ingredientId = e.dataTransfer.getData('ingredient-id');
        const ingredientName = e.dataTransfer.getData('text/plain');
        const source = e.dataTransfer.getData('source');
        
        console.log('Drop on ingredients area:', { ingredientId, ingredientName, source });
        
        // Only process if dragged from a container
        if (source !== 'ingredients') {
          this.removeIngredientFromContainer(source, ingredientId, ingredientName, true);
        }
      });
    }
    
    // Also add drop handler to the grid itself to catch drops there
    if (ingredientsGrid) {
      ingredientsGrid.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        ingredientsAreaWrapper.classList.add('drag-over');
      });
      
      ingredientsGrid.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        ingredientsAreaWrapper.classList.remove('drag-over');
        
        const ingredientId = e.dataTransfer.getData('ingredient-id');
        const ingredientName = e.dataTransfer.getData('text/plain');
        const source = e.dataTransfer.getData('source');
        
        console.log('Drop on ingredients grid:', { ingredientId, ingredientName, source });
        
        // Only process if dragged from a container
        if (source !== 'ingredients') {
          this.removeIngredientFromContainer(source, ingredientId, ingredientName, true);
        }
      });
    }
    
    // EVENT DELEGATION: Set up ONE listener on document for all dragstart/dragend events
    // This handles both ingredient pool items and placed ingredients without re-attaching
    document.addEventListener('dragstart', (e) => {
      const ingredient = e.target.closest('.ingredient, .placed-ingredient');
      if (!ingredient) return;
      
      ingredient.classList.add('dragging');
      this.audioManager.playDragStart();
      
      // Determine source and set data
      const isInIngredientPool = ingredient.closest('#ingredients-area');
      const isInContainer = ingredient.closest('.container');
      
      if (isInIngredientPool) {
        // Ingredient from pool
        e.dataTransfer.setData('text/plain', ingredient.dataset.ingredient);
        e.dataTransfer.setData('ingredient-id', ingredient.dataset.ingredientId);
        e.dataTransfer.setData('source', 'ingredients');
      } else if (isInContainer) {
        // Placed ingredient from container
        const container = ingredient.closest('.container');
        const containerId = container.dataset.containerId;
        e.dataTransfer.setData('text/plain', ingredient.dataset.ingredientName);
        e.dataTransfer.setData('ingredient-id', ingredient.dataset.ingredientId);
        e.dataTransfer.setData('source', containerId);
      }
      
      e.dataTransfer.effectAllowed = 'move';
    });
    
    document.addEventListener('dragend', (e) => {
      const ingredient = e.target.closest('.ingredient, .placed-ingredient');
      if (!ingredient) return;
      ingredient.classList.remove('dragging');
    });
  }

  /**
   * Set up touch drag and drop for mobile
   */
  setupMobileDragAndDrop() {
    // Set up touch for ingredients in ingredients area
    document.querySelectorAll('#ingredients-area .ingredient').forEach(ingredient => {
      this.setupTouchDrag(ingredient, 'ingredients');
    });
    
    // Set up touch for placed ingredients in containers
    document.querySelectorAll('.placed-ingredient').forEach(ingredient => {
      const container = ingredient.closest('.container');
      const containerId = container.dataset.containerId;
      this.setupTouchDrag(ingredient, containerId);
    });
  }

  /**
   * Set up touch drag for a single ingredient
   * @param {HTMLElement} ingredient - Ingredient element
   * @param {string} source - Source identifier ('ingredients' or container ID)
   */
  setupTouchDrag(ingredient, source) {
    // Touch start
    ingredient.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchDragElement = ingredient;
      this.touchDragData = {
        id: ingredient.dataset.ingredientId,
        name: ingredient.dataset.ingredientName || ingredient.dataset.ingredient
      };
      this.touchDragSource = source;
      
      // Calculate offset from touch point to element center
      const touch = e.touches[0];
      const rect = ingredient.getBoundingClientRect();
      this.touchOffsetX = touch.clientX - rect.left;
      this.touchOffsetY = touch.clientY - rect.top;
      
      // Add dragging class
      ingredient.classList.add('dragging');
      this.audioManager.playDragStart();
    }, { passive: false });
    
    // Touch move
    ingredient.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!this.touchDragElement) return;
      
      const touch = e.touches[0];
      
      // Move the element with the touch
      this.touchDragElement.style.position = 'fixed';
      this.touchDragElement.style.zIndex = '1000';
      this.touchDragElement.style.left = (touch.clientX - this.touchOffsetX) + 'px';
      this.touchDragElement.style.top = (touch.clientY - this.touchOffsetY) + 'px';
      
      // Highlight container or ingredients area under touch point
      this.highlightDropZoneUnderTouch(touch);
    }, { passive: false });
    
    // Touch end
    ingredient.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (!this.touchDragElement) return;
      
      const touch = e.changedTouches[0];
      
      // Find container under touch point
      const container = this.getContainerUnderTouch(touch);
      
      if (container) {
        const containerId = container.dataset.containerId;
        this.processDrop(containerId, this.touchDragData.id, this.touchDragData.name, this.touchDragElement, this.touchDragSource);
      } else {
        // Check if dropped on ingredients area
        const ingredientsArea = this.getIngredientsAreaUnderTouch(touch);
        if (ingredientsArea && this.touchDragSource !== 'ingredients') {
          this.removeIngredientFromContainer(this.touchDragSource, this.touchDragData.id, this.touchDragData.name, true);
        } else {
          // No valid drop zone - reset position
          this.touchDragElement.style.position = '';
          this.touchDragElement.style.zIndex = '';
          this.touchDragElement.style.left = '';
          this.touchDragElement.style.top = '';
          this.uiManager.triggerShakeAnimation(this.touchDragElement);
        }
      }
      
      // Clean up
      this.touchDragElement.classList.remove('dragging');
      this.removeContainerHighlights();
      this.touchDragElement = null;
      this.touchDragData = null;
      this.touchDragSource = null;
    }, { passive: false });
  }

  /**
   * Highlight container or ingredients area under touch point
   * @param {Touch} touch - Touch event
   */
  highlightDropZoneUnderTouch(touch) {
    this.removeContainerHighlights();
    
    const container = this.getContainerUnderTouch(touch);
    if (container) {
      container.classList.add('drag-over');
    } else {
      const ingredientsArea = this.getIngredientsAreaUnderTouch(touch);
      if (ingredientsArea) {
        ingredientsArea.classList.add('drag-over');
      }
    }
  }

  /**
   * Highlight container under touch point
   * @param {Touch} touch - Touch event
   */
  highlightContainerUnderTouch(touch) {
    this.removeContainerHighlights();
    
    const container = this.getContainerUnderTouch(touch);
    if (container) {
      container.classList.add('drag-over');
    }
  }

  /**
   * Remove highlights from all containers
   */
  removeContainerHighlights() {
    document.querySelectorAll('.container').forEach(container => {
      container.classList.remove('drag-over');
    });
    
    // Also remove ingredients area highlight
    const ingredientsAreaWrapper = document.querySelector('.ingredients-area');
    if (ingredientsAreaWrapper) {
      ingredientsAreaWrapper.classList.remove('drag-over');
    }
  }

  /**
   * Get container element under touch point
   * @param {Touch} touch - Touch event
   * @returns {HTMLElement|null}
   */
  getContainerUnderTouch(touch) {
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    return elements.find(el => el.classList.contains('container')) || null;
  }

  /**
   * Get ingredients area element under touch point
   * @param {Touch} touch - Touch event
   * @returns {HTMLElement|null}
   */
  getIngredientsAreaUnderTouch(touch) {
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    return elements.find(el => el.classList.contains('ingredients-area')) || null;
  }

  /**
   * Initialize all drag and drop systems - only sets up event listeners ONCE
   * Uses event delegation to avoid duplicate listeners
   */
  initDragAndDrop() {
    // Only initialize once - check if already initialized
    if (this.dragAndDropInitialized) {
      return;
    }
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.setupDesktopDragAndDrop();
      this.setupMobileDragAndDrop();
      this.dragAndDropInitialized = true;
    }, 100);
  }
}
