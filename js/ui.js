/**
 * UI Manager - Handles all UI rendering and screen management
 */

class UIManager {
  constructor(gameEngine, audioManager) {
    this.gameEngine = gameEngine;
    this.audioManager = audioManager;
  }

  /**
   * Show a specific screen and hide others
   * @param {string} screenId - ID of the screen to show
   */
  showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    // Note: Confetti is triggered conditionally in showResult() method
    // only when the answer is correct
  }

  /**
   * Render containers based on game configuration
   */
  renderContainers() {
    const containersArea = document.getElementById('containers-area');
    containersArea.innerHTML = '';

    // Create a container for each defined in config
    Object.keys(GameConfig.containers).forEach(containerId => {
      const containerData = GameConfig.containers[containerId];
      const containerElement = this.createContainer(containerId, containerData);
      containersArea.appendChild(containerElement);
    });
  }

  /**
   * Create a single container element using an SVG cylindrical can
   * @param {string} containerId - Container identifier (A, B, etc.)
   * @param {object} containerData - Container configuration
   * @returns {HTMLElement}
   */
  createContainer(containerId, containerData) {
    const container = document.createElement('div');
    container.className = 'container';
    container.dataset.containerId = containerId;

    // SVG can shape as visual background
    container.appendChild(this.createCanSVG(containerId));

    // Content overlay (header, progress bar, ingredient list)
    const content = document.createElement('div');
    content.className = 'can-content';

    // Container header with name and progress
    const header = document.createElement('div');
    header.className = 'container-header';

    const name = document.createElement('div');
    name.className = 'container-name';
    name.textContent = containerData.name;

    const progress = document.createElement('div');
    progress.className = 'container-progress';
    progress.textContent = `0/${containerData.ingredients.length}`;

    header.appendChild(name);
    header.appendChild(progress);

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';

    const progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressFill.style.width = '0%';
    progressBar.appendChild(progressFill);

    // Ingredients list (where placed ingredients appear)
    const ingredientsList = document.createElement('div');
    ingredientsList.className = 'ingredients-list';

    content.appendChild(header);
    content.appendChild(progressBar);
    content.appendChild(ingredientsList);
    container.appendChild(content);

    return container;
  }

  /**
   * Build the SVG cylindrical can shape with fill layer
   * ViewBox: 400×420 (~0.95:1 width-to-height ratio, taller can)
   * Can body: y=25 (top rim) to y=398 (bottom rim) = 373 SVG units tall
   * @param {string} containerId - Used to create unique SVG element IDs
   * @returns {SVGElement}
   */
  createCanSVG(containerId) {
    const NS = 'http://www.w3.org/2000/svg';
    const id = containerId;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 420');
    svg.classList.add('can-svg');
    svg.setAttribute('aria-hidden', 'true');

    // --- DEFS ---
    const defs = document.createElementNS(NS, 'defs');

    // Clip path: bounds the fill rect inside the can body outline
    const clipPath = document.createElementNS(NS, 'clipPath');
    clipPath.setAttribute('id', `can-clip-${id}`);
    const clipShape = document.createElementNS(NS, 'path');
    clipShape.setAttribute('d', 'M8,25 A192,20 0 0,1 392,25 L392,398 A192,18 0 0,1 8,398 Z');
    clipPath.appendChild(clipShape);
    defs.appendChild(clipPath);

    // Body gradient: left-to-right horizontal shading for 3D cylinder
    const bodyGrad = document.createElementNS(NS, 'linearGradient');
    bodyGrad.setAttribute('id', `body-grad-${id}`);
    bodyGrad.setAttribute('x1', '0%'); bodyGrad.setAttribute('y1', '0%');
    bodyGrad.setAttribute('x2', '100%'); bodyGrad.setAttribute('y2', '0%');
    [
      ['0%', '#bebebe'], ['10%', '#eeeeee'], ['28%', '#ffffff'],
      ['72%', '#f6f6f6'], ['90%', '#e0e0e0'], ['100%', '#b0b0b0']
    ].forEach(([offset, color]) => {
      const stop = document.createElementNS(NS, 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', color);
      bodyGrad.appendChild(stop);
    });
    defs.appendChild(bodyGrad);

    // Fill gradient: bottom-to-top, blue-white powder effect
    const fillGrad = document.createElementNS(NS, 'linearGradient');
    fillGrad.setAttribute('id', `fill-grad-${id}`);
    fillGrad.setAttribute('x1', '0%'); fillGrad.setAttribute('y1', '100%');
    fillGrad.setAttribute('x2', '0%'); fillGrad.setAttribute('y2', '0%');
    [['0%', '#7ab8e8', '0.85'], ['100%', '#d6eaf8', '0.5']].forEach(([offset, color, opacity]) => {
      const stop = document.createElementNS(NS, 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', color);
      stop.setAttribute('stop-opacity', opacity);
      fillGrad.appendChild(stop);
    });
    defs.appendChild(fillGrad);

    // Lid gradient: top-to-bottom for slight depth
    const lidGrad = document.createElementNS(NS, 'linearGradient');
    lidGrad.setAttribute('id', `lid-grad-${id}`);
    lidGrad.setAttribute('x1', '0%'); lidGrad.setAttribute('y1', '0%');
    lidGrad.setAttribute('x2', '0%'); lidGrad.setAttribute('y2', '100%');
    [['0%', '#ffffff'], ['100%', '#dcdcdc']].forEach(([offset, color]) => {
      const stop = document.createElementNS(NS, 'stop');
      stop.setAttribute('offset', offset);
      stop.setAttribute('stop-color', color);
      lidGrad.appendChild(stop);
    });
    defs.appendChild(lidGrad);

    svg.appendChild(defs);

    // --- DROP SHADOW (bottom ellipse) ---
    const shadow = document.createElementNS(NS, 'ellipse');
    shadow.setAttribute('cx', '200'); shadow.setAttribute('cy', '410');
    shadow.setAttribute('rx', '175'); shadow.setAttribute('ry', '10');
    shadow.setAttribute('fill', 'rgba(0,0,0,0.14)');
    svg.appendChild(shadow);

    // --- CAN BODY ---
    const body = document.createElementNS(NS, 'path');
    body.setAttribute('d', 'M8,25 A192,20 0 0,1 392,25 L392,398 A192,18 0 0,1 8,398 Z');
    body.setAttribute('fill', `url(#body-grad-${id})`);
    svg.appendChild(body);

    // --- FILL LAYER (grows upward from bottom with curved bottom edge) ---
    // Use a path instead of rect to match the elliptical curve of the container bottom
    const fillPath = document.createElementNS(NS, 'path');
    fillPath.setAttribute('d', 'M8,398 A192,18 0 0,1 392,398 L392,398 L8,398 Z'); // starts empty
    fillPath.setAttribute('fill', `url(#fill-grad-${id})`);
    fillPath.setAttribute('clip-path', `url(#can-clip-${id})`);
    fillPath.classList.add('svg-fill-path');
    svg.appendChild(fillPath);

    // --- LEFT SPECULAR HIGHLIGHT (3D sheen) ---
    const specular = document.createElementNS(NS, 'path');
    specular.setAttribute('d', 'M20,55 C16,188 16,265 20,365');
    specular.setAttribute('stroke', 'rgba(255,255,255,0.45)');
    specular.setAttribute('stroke-width', '14');
    specular.setAttribute('fill', 'none');
    specular.setAttribute('stroke-linecap', 'round');
    svg.appendChild(specular);

    // --- CAN BORDER (dashed by default; CSS handles state changes) ---
    const border = document.createElementNS(NS, 'path');
    border.setAttribute('d', 'M8,25 A192,20 0 0,1 392,25 L392,398 A192,18 0 0,1 8,398 Z');
    border.classList.add('can-border');
    svg.appendChild(border);

    // --- TOP LID (ellipse cap) ---
    const lid = document.createElementNS(NS, 'ellipse');
    lid.setAttribute('cx', '200'); lid.setAttribute('cy', '25');
    lid.setAttribute('rx', '192'); lid.setAttribute('ry', '20');
    lid.setAttribute('fill', `url(#lid-grad-${id})`);
    lid.setAttribute('stroke', '#1E3A8A');
    lid.setAttribute('stroke-width', '2');
    svg.appendChild(lid);

    // --- LID SPECULAR HIGHLIGHT ---
    const lidSheen = document.createElementNS(NS, 'ellipse');
    lidSheen.setAttribute('cx', '168'); lidSheen.setAttribute('cy', '19');
    lidSheen.setAttribute('rx', '88'); lidSheen.setAttribute('ry', '7');
    lidSheen.setAttribute('fill', 'rgba(255,255,255,0.65)');
    svg.appendChild(lidSheen);

    return svg;
  }

  /**
   * Update container progress indicator
   * @param {string} containerId - Container identifier
   * @param {number} current - Current ingredient count
   * @param {number} total - Total required ingredients
   */
  updateProgress(containerId, current, total) {
    const container = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!container) return;

    // Update progress text
    const progressText = container.querySelector('.container-progress');
    progressText.textContent = `${current}/${total}`;

    // Update progress bar
    const progressFill = container.querySelector('.progress-fill');
    const percentage = (current / total) * 100;
    progressFill.style.width = `${percentage}%`;

    // Toggle complete class: add when filled, remove when ingredients are taken out
    if (current >= total) {
      container.classList.add('complete');
    } else {
      container.classList.remove('complete');
    }
  }

  /**
   * Update the SVG fill layer based on total ingredients placed
   * Can body spans SVG y=25 to y=398 (373 units total height)
   * Fill path uses curved bottom matching container's elliptical curve
   * @param {string} containerId - Container identifier
   * @param {number} totalPlaced - Total number of ingredients placed
   * @param {number} totalRequired - Total required ingredients
   */
  updateFillLevel(containerId, totalPlaced, totalRequired) {
    const container = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!container) return;

    const fillPath = container.querySelector('.svg-fill-path');
    if (!fillPath) return;

    // Calculate fill percentage (capped at 100%)
    const fillPercentage = Math.min((totalPlaced / totalRequired) * 100, 100);

    // Can body in SVG coordinates: top y=25, bottom y=398 → 373 units tall
    const canBodyBottom = 398;
    const canBodyTop = 25;
    const canBodyHeight = canBodyBottom - canBodyTop; // 373

    const fillHeight = (fillPercentage / 100) * canBodyHeight;
    const fillTopY = canBodyBottom - fillHeight;

    // Build path with curved bottom matching container's elliptical curve
    // Path: start bottom-left, curve to bottom-right, go up to top-right, across to top-left, down to start
    const pathD = `M8,${canBodyBottom} A192,18 0 0,1 392,${canBodyBottom} L392,${fillTopY} L8,${fillTopY} Z`;
    fillPath.setAttribute('d', pathD);

    console.log(`Container ${containerId} fill: ${fillPercentage.toFixed(0)}% (${totalPlaced}/${totalRequired})`);

    // Trigger completion effect when 100% filled
    if (fillPercentage >= 100 && totalPlaced >= totalRequired) {
      this.triggerContainerCompletion(container);
    }
  }

  /**
   * Trigger completion visual effect on container
   * @param {HTMLElement} container - Container element
   */
  triggerContainerCompletion(container) {
    // Brief glow animation using the SVG-compatible drop-shadow keyframe
    container.style.animation = 'container-glow 1.5s ease-in-out';
    setTimeout(() => {
      container.style.animation = '';
    }, 1500);
  }

  /**
   * Add ingredient to container's ingredient list
   * @param {string} containerId - Container identifier
   * @param {string} ingredientId - Unique ingredient ID
   * @param {string} ingredientName - Ingredient name
   * @param {HTMLElement} sourceElement - Source element being moved (optional)
   */
  addIngredientToContainer(containerId, ingredientId, ingredientName, sourceElement = null) {
    const container = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!container) return;

    const ingredientsList = container.querySelector('.ingredients-list');
    
    // Check if already exists in container
    const existing = ingredientsList.querySelector(`[data-ingredient-id="${ingredientId}"]`);
    if (existing) return;
    
    const ingredientElement = document.createElement('div');
    ingredientElement.className = 'placed-ingredient';
    ingredientElement.dataset.ingredientId = ingredientId;
    ingredientElement.dataset.ingredientName = ingredientName;
    ingredientElement.textContent = `${GameConfig.ingredientIcons[ingredientName] || '•'} ${ingredientName}`;
    ingredientElement.draggable = true;
    
    ingredientsList.appendChild(ingredientElement);
  }

  /**
   * Remove ingredient from container's ingredient list
   * @param {string} containerId - Container identifier
   * @param {string} ingredientId - Unique ingredient ID
   */
  removeIngredientFromContainer(containerId, ingredientId) {
    const container = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!container) return;

    const ingredientsList = container.querySelector('.ingredients-list');
    const ingredientElement = ingredientsList.querySelector(`[data-ingredient-id="${ingredientId}"]`);
    
    if (ingredientElement) {
      ingredientElement.remove();
    }
  }

  /**
   * Add ingredient back to the ingredients area
   * @param {string} ingredientId - Unique ingredient ID
   * @param {string} ingredientName - Ingredient name
   */
  addIngredientBackToArea(ingredientId, ingredientName) {
    const ingredientsArea = document.getElementById('ingredients-area');
    if (!ingredientsArea) return;

    // Check if already exists
    const existing = ingredientsArea.querySelector(`[data-ingredient-id="${ingredientId}"]`);
    if (existing) return;

    // Find the correct container for this ingredient
    let correctContainer = null;
    for (const containerId of Object.keys(GameConfig.containers)) {
      const container = GameConfig.containers[containerId];
      if (container.ingredients.includes(ingredientName)) {
        correctContainer = containerId;
        break;
      }
    }

    // Create ingredient element
    const ingredient = {
      id: ingredientId,
      name: ingredientName,
      container: correctContainer
    };
    
    const element = this.createIngredientElement(ingredient);
    ingredientsArea.appendChild(element);
  }

  /**
   * Render draggable ingredients in random order
   */
  renderIngredients() {
    const ingredientsArea = document.getElementById('ingredients-area');
    ingredientsArea.innerHTML = '';

    // Build list of all ingredients with their correct container
    const allIngredients = [];
    
    Object.keys(GameConfig.containers).forEach(containerId => {
      const containerData = GameConfig.containers[containerId];
      containerData.ingredients.forEach(ingredientName => {
        allIngredients.push({
          name: ingredientName,
          container: containerId
        });
      });
    });

    // Shuffle ingredients
    const shuffled = this.shuffleArray(allIngredients);

    // Create ingredient elements
    shuffled.forEach(ingredient => {
      const element = this.createIngredientElement(ingredient);
      ingredientsArea.appendChild(element);
    });
  }

  /**
   * Create a draggable ingredient element
   * @param {object} ingredient - Ingredient data
   * @returns {HTMLElement}
   */
  createIngredientElement(ingredient) {
    const div = document.createElement('div');
    div.className = 'ingredient';
    div.draggable = true;
    div.dataset.ingredientId = ingredient.id || GameConfig.generateIngredientId(ingredient.name);
    div.dataset.ingredient = ingredient.name;
    div.dataset.correctContainer = ingredient.container;

    const icon = document.createElement('div');
    icon.className = 'ingredient-icon';
    icon.textContent = GameConfig.ingredientIcons[ingredient.name] || '•';

    const name = document.createElement('div');
    name.className = 'ingredient-name';
    name.textContent = ingredient.name;

    div.appendChild(icon);
    div.appendChild(name);

    return div;
  }

  /**
   * Update hints remaining display
   * @param {number} hintsLeft - Number of hints remaining
   */
  updateHintsDisplay(hintsLeft) {
    const hintsElement = document.getElementById('hints-left');
    hintsElement.textContent = hintsLeft;

    // Disable hint button if no hints left
    const hintButton = document.getElementById('hint-btn');
    if (hintsLeft <= 0) {
      hintButton.disabled = true;
    }
  }

  /**
   * Show hint highlight on correct container
   * @param {string} containerId - Container to highlight
   */
  showHintHighlight(containerId) {
    const container = document.querySelector(`[data-container-id="${containerId}"]`);
    if (!container) return;

    // Add highlight class with animation
    container.classList.add('highlight');
    
    // Remove highlight after animation completes
    setTimeout(() => {
      container.classList.remove('highlight');
    }, 1500);
  }

  /**
   * Trigger shake animation on an element
   * @param {HTMLElement} element - Element to shake
   */
  triggerShakeAnimation(element) {
    element.classList.add('shake');
    
    // Remove shake class after animation completes
    setTimeout(() => {
      element.classList.remove('shake');
    }, 600);
  }

  /**
   * Show result with correct/incorrect message
   * @param {object} result - Result object with isCorrect and details
   */
  showResult(result) {
    const resultScreen = document.getElementById('result-screen');
    
    // Set screen state class for background styling
    resultScreen.classList.remove('success-state', 'failure-state');
    resultScreen.classList.add(result.isCorrect ? 'success-state' : 'failure-state');
    
    // Trigger confetti and particles if correct
    if (result.isCorrect) {
      setTimeout(() => this.triggerConfetti(), 300);
      setTimeout(() => this.triggerParticles(), 500);
    }
    
    // Update achievement badge
    const badgeIcon = document.getElementById('badge-icon');
    const achievementBadge = document.getElementById('achievement-badge');
    if (result.isCorrect) {
      badgeIcon.textContent = '🏆';
      achievementBadge.style.display = 'flex';
    } else {
      badgeIcon.textContent = '💪';
      achievementBadge.style.display = 'flex';
    }
    
    // Animate stars (show 3 stars for success, 0 for failure)
    this.animateStars(result.isCorrect ? 3 : 0);
    
    // Update result title
    const resultTitle = document.getElementById('result-title');
    resultTitle.textContent = result.isCorrect ? 'Congratulations!' : 'Game Complete!';
    
    // Update result message
    const resultIcon = document.getElementById('result-icon');
    const resultText = document.getElementById('result-text');
    const resultSubtitle = document.getElementById('result-subtitle');
    const detailsMessage = document.getElementById('details-message');
    
    if (result.isCorrect) {
      resultIcon.textContent = '🎉';
      resultText.textContent = 'Perfect Match!';
      resultSubtitle.textContent = 'You successfully matched all ingredients to their containers!';
      detailsMessage.style.display = 'none';
    } else {
      resultIcon.textContent = '❌';
      resultText.textContent = 'Not Quite Right';
      resultSubtitle.textContent = 'Some ingredients are in the wrong containers. Try again!';
      detailsMessage.textContent = result.details;
      detailsMessage.style.display = 'block';
    }
    
    // Update stats (placeholder values - can be enhanced with actual game data)
    this.updateStats(result.isCorrect);
  }
  
  /**
   * Animate stars appearing with delay
   * @param {number} count - Number of stars to activate
   */
  animateStars(count) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
      star.classList.remove('active');
      if (index < count) {
        setTimeout(() => {
          star.classList.add('active');
        }, 400 + (index * 200));
      }
    });
  }
  
  /**
   * Update statistics display
   * @param {boolean} isCorrect - Whether the answer was correct
   */
  updateStats(isCorrect) {
    // These would ideally come from actual game state
    // For now, showing placeholder values
    const accuracyStat = document.getElementById('accuracy-stat');
    const timeStat = document.getElementById('time-stat');
    const hintsStat = document.getElementById('hints-stat');
    
    if (isCorrect) {
      accuracyStat.textContent = '100%';
      timeStat.textContent = '1:23'; // Placeholder - would track actual time
      hintsStat.textContent = document.getElementById('hints-left').textContent;
    } else {
      accuracyStat.textContent = '65%'; // Placeholder
      timeStat.textContent = '2:15'; // Placeholder
      hintsStat.textContent = document.getElementById('hints-left').textContent;
    }
  }
  
  /**
   * Trigger floating particles animation
   */
  triggerParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Create 30 floating particles
    const colors = ['#FFD700', '#FFA500', '#4CAF50', '#1E3A8A', '#FFFFFF'];
    
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      particle.style.left = Math.random() * 100 + '%';
      particle.style.bottom = '0';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
      particle.style.animationDelay = Math.random() * 1.5 + 's';
      particle.style.width = (Math.random() * 8 + 4) + 'px';
      particle.style.height = particle.style.width;
      
      container.appendChild(particle);
    }
    
    // Clean up particles after animation
    setTimeout(() => {
      container.innerHTML = '';
    }, 4000);
  }

  /**
   * Show instructions modal
   */
  showInstructionsModal() {
    const modal = document.getElementById('instructions-modal');
    modal.classList.add('active');
  }

  /**
   * Hide instructions modal
   */
  hideInstructionsModal() {
    const modal = document.getElementById('instructions-modal');
    modal.classList.remove('active');
  }

  /**
   * Trigger confetti animation on result screen
   */
  triggerConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';

    // Create 80 confetti particles
    const colors = [
      '#FFD700', '#FFA500', '#FF6347', '#4CAF50', 
      '#1E3A8A', '#D4AF37', '#E53935', '#FFFFFF'
    ];

    for (let i = 0; i < 80; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      
      // Random properties
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      confetti.style.width = (Math.random() * 10 + 5) + 'px';
      confetti.style.height = (Math.random() * 10 + 5) + 'px';
      confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      
      container.appendChild(confetti);
    }

    // Clean up confetti after animation
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array}
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
